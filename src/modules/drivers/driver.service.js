const supabase = require('../../config/db');
const { acceptOrder } = require('../../services/driverMatching.service');
const { verifyOTP } = require('../../services/otp.service');
const { getIO } = require('../../config/socket');

const goOnline = async (driverId, lat, lng) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      is_online: true,
      current_lat: lat,
      current_lng: lng
    })
    .eq('id', driverId)
    .eq('role', 'driver')
    .select()
    .single();

  if (error) throw error;
  return data;
};

const goOffline = async (driverId) => {
  // Check if driver has active order
  const { data: activeOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('driver_id', driverId)
    .in('status', ['accepted', 'picked_up', 'on_the_way'])
    .single();

  if (activeOrder) {
    throw new Error('Cannot go offline with active order');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ is_online: false })
    .eq('id', driverId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateLocation = async (driverId, lat, lng) => {
  const { error } = await supabase
    .from('users')
    .update({
      current_lat: lat,
      current_lng: lng
    })
    .eq('id', driverId);

  if (error) throw error;

  // Check if driver has active order - emit location to user
  const { data: activeOrder } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('driver_id', driverId)
    .in('status', ['accepted', 'picked_up', 'on_the_way'])
    .single();

  if (activeOrder) {
    const io = getIO();
    io.to(`user:${activeOrder.user_id}`).emit('driver:location', {
      orderId: activeOrder.id,
      lat,
      lng
    });
  }

  return { success: true };
};

const handleAcceptOrder = async (driverId, orderId) => {
  const result = await acceptOrder(orderId, driverId);
  
  if (!result.success) {
    throw new Error(result.message);
  }

  // Emit to user that order is accepted
  const io = getIO();
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      driver:users!orders_driver_id_fkey(id, name, current_lat, current_lng)
    `)
    .eq('id', orderId)
    .single();

  io.to(`user:${order.user_id}`).emit('order:update', {
    orderId,
    status: 'accepted',
    driver: order.driver
  });

  return order;
};

const handlePickup = async (driverId, orderId) => {
  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('status, driver_id')
    .eq('id', orderId)
    .single();

  if (getError || !order) throw new Error('Order not found');
  if (order.driver_id !== driverId) throw new Error('Not authorized');
  if (order.status !== 'accepted') throw new Error('Invalid status');

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: 'picked_up' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Emit to user
  const io = getIO();
  const { data: fullOrder } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single();

  io.to(`user:${fullOrder.user_id}`).emit('order:update', {
    orderId,
    status: 'picked_up'
  });

  return updated;
};

const startDelivery = async (driverId, orderId) => {
  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('status, driver_id, user_id')
    .eq('id', orderId)
    .single();

  if (getError || !order) throw new Error('Order not found');
  if (order.driver_id !== driverId) throw new Error('Not authorized');
  if (order.status !== 'picked_up') throw new Error('Invalid status');

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: 'on_the_way' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Emit to user
  const io = getIO();
  io.to(`user:${order.user_id}`).emit('order:update', {
    orderId,
    status: 'on_the_way'
  });

  return updated;
};

const completeOrder = async (driverId, orderId, otp) => {
  // Get order
  const { data: order, error: getError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (getError || !order) throw new Error('Order not found');
  if (order.driver_id !== driverId) throw new Error('Not authorized');
  if (order.status !== 'on_the_way') throw new Error('Invalid status');

  // Verify OTP
  if (!verifyOTP(order.otp, otp)) {
    throw new Error('Invalid OTP');
  }

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) throw updateError;

  // Credit driver wallet
  await supabase
    .from('driver_wallet_transactions')
    .insert({
      driver_id: driverId,
      order_id: orderId,
      amount: order.driver_earning
    });

  // Update driver wallet balance and availability
  const { data: driver } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', driverId)
    .single();

  await supabase
    .from('users')
    .update({
      wallet_balance: (driver.wallet_balance || 0) + order.driver_earning,
      is_available: true
    })
    .eq('id', driverId);

  // Emit to user
  const io = getIO();
  io.to(`user:${order.user_id}`).emit('order:completed', {
    orderId,
    status: 'delivered'
  });

  return { success: true, earning: order.driver_earning };
};

const getCurrentOrder = async (driverId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      hotel:hotels(id, name, lat, lng),
      user:users!orders_user_id_fkey(id, name)
    `)
    .eq('driver_id', driverId)
    .in('status', ['accepted', 'picked_up', 'on_the_way'])
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

const getDriverStats = async (driverId) => {
  const { data: driver } = await supabase
    .from('users')
    .select('wallet_balance, is_online, is_available')
    .eq('id', driverId)
    .single();

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .eq('status', 'delivered');

  return {
    ...driver,
    total_deliveries: totalOrders || 0
  };
};

module.exports = {
  goOnline,
  goOffline,
  updateLocation,
  handleAcceptOrder,
  handlePickup,
  startDelivery,
  completeOrder,
  getCurrentOrder,
  getDriverStats
};
