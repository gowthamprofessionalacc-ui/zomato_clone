const supabase = require('../config/db');
const { calculateDistance } = require('./distance.service');
const { getIO } = require('../config/socket');

// Store active timeouts for orders
const activeTimeouts = {};

// Store current driver index for each order (for cascade matching)
const orderDriverIndex = {};

// Store sorted drivers for each order to enable rejection cascade
const orderDriversCache = {};

const cacheDriversForOrder = (orderId, drivers) => {
  orderDriversCache[orderId] = drivers;
};

const sendToNextDriver = async (orderId, sortedDrivers, hotelLat, hotelLng) => {
  let currentIndex = orderDriverIndex[orderId] || 0;

  // Find next driver who is still online and available
  while (currentIndex < sortedDrivers.length) {
    const driver = sortedDrivers[currentIndex];
    
    // Check if driver is still online and available
    const { data: driverStatus } = await supabase
      .from('users')
      .select('is_online, is_available')
      .eq('id', driver.id)
      .single();
    
    if (driverStatus && driverStatus.is_online && driverStatus.is_available) {
      break; // Found valid driver
    }
    
    console.log(`Driver ${driver.name} no longer online/available, skipping`);
    currentIndex++;
    orderDriverIndex[orderId] = currentIndex;
  }

  if (currentIndex >= sortedDrivers.length) {
    console.log(`All drivers exhausted for order ${orderId}`);
    delete orderDriverIndex[orderId];
    delete orderDriversCache[orderId];
    return;
  }

  const driver = sortedDrivers[currentIndex];
  const io = getIO();

  // Get order details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      hotel:hotels(id, name, lat, lng),
      user:users!orders_user_id_fkey(id, name)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order || order.status !== 'searching_driver') {
    console.log(`Order ${orderId} no longer searching`);
    return;
  }

  // Emit to specific driver
  io.to(`driver:${driver.id}`).emit('order:new', {
    orderId: order.id,
    hotel: order.hotel,
    user: { name: order.user.name },
    driverToHotelDistance: driver.distance,
    hotelToUserDistance: order.delivery_distance_km,
    earning: order.driver_earning,
    timeout: 15
  });

  console.log(`Order ${orderId} sent to driver ${driver.name} (index ${currentIndex})`);

  // Set 15 second timeout
  activeTimeouts[orderId] = setTimeout(async () => {
    console.log(`Driver ${driver.name} timeout for order ${orderId}`);
    orderDriverIndex[orderId] = currentIndex + 1;
    await sendToNextDriver(orderId, sortedDrivers, hotelLat, hotelLng);
  }, 15000);
};

const findAndAssignDriver = async (orderId, hotelLat, hotelLng) => {
  try {
    // Fetch all available drivers
    const { data: drivers, error } = await supabase
      .from('users')
      .select('id, name, current_lat, current_lng')
      .eq('role', 'driver')
      .eq('is_online', true)
      .eq('is_available', true);

    if (error) throw error;

    if (!drivers || drivers.length === 0) {
      console.log(`No available drivers for order ${orderId}`);
      return null;
    }

    // Calculate distance for each driver and sort by nearest
    const driversWithDistance = drivers
      .filter(d => d.current_lat && d.current_lng)
      .map(driver => ({
        ...driver,
        distance: calculateDistance(
          driver.current_lat,
          driver.current_lng,
          hotelLat,
          hotelLng
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    if (driversWithDistance.length === 0) {
      console.log(`No drivers with location for order ${orderId}`);
      return null;
    }

    // Initialize driver index for this order
    orderDriverIndex[orderId] = 0;

    // Cache sorted drivers for rejection cascade
    cacheDriversForOrder(orderId, driversWithDistance);

    console.log(`Found ${driversWithDistance.length} drivers for order ${orderId}`);

    // Start matching with nearest driver
    await sendToNextDriver(orderId, driversWithDistance, hotelLat, hotelLng);

    return driversWithDistance[0];
  } catch (err) {
    console.error('Error in findAndAssignDriver:', err);
    return null;
  }
};

const clearOrderTimeout = (orderId) => {
  if (activeTimeouts[orderId]) {
    clearTimeout(activeTimeouts[orderId]);
    delete activeTimeouts[orderId];
  }
  delete orderDriverIndex[orderId];
  delete orderDriversCache[orderId];
};

const rejectAndMoveToNext = async (orderId, hotelLat, hotelLng) => {
  // Clear current timeout
  if (activeTimeouts[orderId]) {
    clearTimeout(activeTimeouts[orderId]);
    delete activeTimeouts[orderId];
  }

  const currentIndex = orderDriverIndex[orderId] || 0;
  const sortedDrivers = orderDriversCache[orderId];

  if (!sortedDrivers) {
    console.log(`No cached drivers for order ${orderId}, refetching...`);
    // Refetch drivers if cache is empty
    await findAndAssignDriver(orderId, hotelLat, hotelLng);
    return;
  }

  // Move to next driver
  const nextIndex = currentIndex + 1;
  orderDriverIndex[orderId] = nextIndex;
  
  console.log(`Reject: Moving order ${orderId} from driver index ${currentIndex} to ${nextIndex}`);
  
  await sendToNextDriver(orderId, sortedDrivers, hotelLat, hotelLng);
};

const acceptOrder = async (orderId, driverId) => {
  // Clear timeout first
  clearOrderTimeout(orderId);

  // Atomic update - only succeeds if status is still searching_driver
  const { data, error } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('status', 'searching_driver')
    .select()
    .single();

  if (error || !data) {
    return { success: false, message: 'Order already accepted or not available' };
  }

  // Set driver as unavailable
  await supabase
    .from('users')
    .update({ is_available: false })
    .eq('id', driverId);

  return { success: true, order: data };
};

module.exports = {
  findAndAssignDriver,
  clearOrderTimeout,
  acceptOrder,
  rejectAndMoveToNext,
  activeTimeouts,
  orderDriversCache
};
