const driverService = require('../modules/drivers/driver.service');

const setupDriverSocket = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user;

    // Only handle driver connections
    if (user.role !== 'driver') return;

    console.log(`Driver ${user.id} connected`);

    // Join driver room
    socket.join(`driver:${user.id}`);

    // Handle go online
    socket.on('driver:go-online', async (data) => {
      try {
        const { lat, lng } = data;
        await driverService.goOnline(user.id, lat, lng);
        socket.emit('driver:status', { is_online: true });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle go offline
    socket.on('driver:go-offline', async () => {
      try {
        await driverService.goOffline(user.id);
        socket.emit('driver:status', { is_online: false });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle location update
    socket.on('driver:location:update', async (data) => {
      try {
        const { lat, lng } = data;
        await driverService.updateLocation(user.id, lat, lng);
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // Handle order accept
    socket.on('order:accept', async (data) => {
      try {
        const { orderId } = data;
        const order = await driverService.handleAcceptOrder(user.id, orderId);
        socket.emit('order:accepted', order);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle order reject - immediately move to next driver
    socket.on('order:reject', async (data) => {
      try {
        const { orderId } = data;
        console.log(`Driver ${user.id} rejected order ${orderId}`);
        
        // Get order to find hotel location
        const supabase = require('../config/db');
        const { data: order } = await supabase
          .from('orders')
          .select('hotel:hotels(lat, lng)')
          .eq('id', orderId)
          .single();
        
        if (order && order.hotel) {
          const { rejectAndMoveToNext } = require('../services/driverMatching.service');
          await rejectAndMoveToNext(orderId, order.hotel.lat, order.hotel.lng);
        }
      } catch (err) {
        console.error('Reject error:', err.message);
      }
    });

    // Handle pickup
    socket.on('order:pickup', async (data) => {
      try {
        const { orderId } = data;
        const order = await driverService.handlePickup(user.id, orderId);
        socket.emit('order:update', { orderId, status: 'picked_up' });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle start delivery
    socket.on('order:start-delivery', async (data) => {
      try {
        const { orderId } = data;
        const order = await driverService.startDelivery(user.id, orderId);
        socket.emit('order:update', { orderId, status: 'on_the_way' });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle complete
    socket.on('order:complete', async (data) => {
      try {
        const { orderId, otp } = data;
        const result = await driverService.completeOrder(user.id, orderId, otp);
        socket.emit('order:completed', result);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Driver ${user.id} disconnected`);
    });
  });
};

module.exports = setupDriverSocket;
