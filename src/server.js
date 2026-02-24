const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { port } = require('./config/env');
const setupDriverSocket = require('./sockets/driver.socket');
const setupUserSocket = require('./sockets/user.socket');
const { autoCancelStaleOrders } = require('./modules/orders/order.service');

const server = http.createServer(app);
const io = initSocket(server);

// Setup socket handlers
setupDriverSocket(io);
setupUserSocket(io);

// Auto-cancel stale orders every minute
setInterval(async () => {
  try {
    await autoCancelStaleOrders();
  } catch (err) {
    console.error('Auto-cancel error:', err);
  }
}, 60 * 1000);

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 Test: http://127.0.0.1:${port}/health`);
  console.log(`⏰ Auto-cancel enabled (5 min timeout)`);
});
