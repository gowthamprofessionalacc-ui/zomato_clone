const supabase = require('../../config/db');
const { generateOTP } = require('../../services/otp.service');
const { calculateDistance } = require('../../services/distance.service');
const { findAndAssignDriver } = require('../../services/driverMatching.service');

// Valid state transitions
const STATE_TRANSITIONS = {
  pending: ['searching_driver'],
  searching_driver: ['accepted'],
  accepted: ['picked_up'],
  picked_up: ['on_the_way'],
  on_the_way: ['delivered']
};

const validateTransition = (currentStatus, newStatus) => {
  const allowed = STATE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

const createOrder = async (userId, deliveryLat, deliveryLng, couponCode = null) => {
  // Check for active order (not delivered or cancelled)
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id, status')
    .eq('user_id', userId)
    .not('status', 'in', '("delivered","cancelled")')
    .limit(1);

  if (activeOrders && activeOrders.length > 0) {
    throw new Error('You have an active order in progress. Please wait until it is delivered.');
  }

  // Get user's cart (handle multiple carts - get the most recent one)
  const { data: carts, error: cartError } = await supabase
    .from('carts')
    .select(`
      id,
      hotel_id,
      hotel:hotels(id, name, lat, lng),
      items:cart_items(
        id,
        quantity,
        food:foods(id, name, price)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const cart = carts && carts.length > 0 ? carts[0] : null;

  if (cartError || !cart || !cart.items.length) {
    throw new Error('Cart is empty');
  }

  // Calculate totals
  let totalAmount = 0;
  const orderItems = cart.items.map(item => {
    const itemTotal = item.food.price * item.quantity;
    totalAmount += itemTotal;
    return {
      food_id: item.food.id,
      quantity: item.quantity,
      price_at_time: item.food.price
    };
  });

  // Apply coupon (mock - 10% off if code is FLAT10)
  let finalAmount = totalAmount;
  if (couponCode === 'FLAT10') {
    finalAmount = totalAmount * 0.9;
  }

  // Calculate delivery distance (hotel to user)
  const deliveryDistanceKm = calculateDistance(
    cart.hotel.lat,
    cart.hotel.lng,
    deliveryLat,
    deliveryLng
  );

  // Calculate driver earning
  const driverEarning = deliveryDistanceKm * 10;

  // Generate OTP
  const otp = generateOTP();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      hotel_id: cart.hotel_id,
      status: 'searching_driver',
      total_amount: totalAmount,
      final_amount: finalAmount,
      delivery_distance_km: deliveryDistanceKm,
      driver_earning: driverEarning,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,
      otp
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const itemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id
  }));

  await supabase.from('order_items').insert(itemsWithOrderId);

  // Clear cart
  await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  await supabase.from('carts').delete().eq('id', cart.id);

  // Start driver matching
  findAndAssignDriver(order.id, cart.hotel.lat, cart.hotel.lng);

  return {
    ...order,
    hotel: cart.hotel,
    items: orderItems
  };
};

const getOrderById = async (orderId, userId = null) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      hotel:hotels(id, name, lat, lng),
      driver:users!orders_driver_id_fkey(id, name, current_lat, current_lng),
      items:order_items(
        id,
        quantity,
        price_at_time,
        food:foods(id, name)
      )
    `)
    .eq('id', orderId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data;
};

const getUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      hotel:hotels(id, name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const updateOrderStatus = async (orderId, newStatus, driverId = null) => {
  // Get current order
  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('status, driver_id')
    .eq('id', orderId)
    .single();

  if (getError || !order) throw new Error('Order not found');

  // Validate driver ownership if driverId provided
  if (driverId && order.driver_id !== driverId) {
    throw new Error('Not authorized');
  }

  // Validate state transition
  if (!validateTransition(order.status, newStatus)) {
    throw new Error(`Invalid transition from ${order.status} to ${newStatus}`);
  }

  const updateData = { status: newStatus };
  if (newStatus === 'delivered') {
    updateData.delivered_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated;
};

const cancelOrder = async (orderId, userId) => {
  // Get current order
  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', orderId)
    .single();

  if (getError || !order) throw new Error('Order not found');

  // Verify user owns this order
  if (order.user_id !== userId) {
    throw new Error('Not authorized');
  }

  // Can only cancel when searching_driver
  if (order.status !== 'searching_driver') {
    throw new Error('Order can only be cancelled while searching for driver');
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated;
};

// Auto-cancel orders stuck in searching_driver for more than 5 minutes
const autoCancelStaleOrders = async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('status', 'searching_driver')
    .lt('created_at', fiveMinutesAgo)
    .select('id');

  if (data && data.length > 0) {
    console.log(`Auto-cancelled ${data.length} stale orders`);
  }
  
  return data;
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  validateTransition,
  cancelOrder,
  autoCancelStaleOrders
};
