const setupUserSocket = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user;

    // Only handle user connections
    if (user.role !== 'user') return;

    console.log(`User ${user.id} connected`);

    // Join user room
    socket.join(`user:${user.id}`);

    // Users mainly receive events, not emit
    // Events received:
    // - order:update (status changes)
    // - driver:location (live tracking)
    // - order:completed

    socket.on('disconnect', () => {
      console.log(`User ${user.id} disconnected`);
    });
  });
};

module.exports = setupUserSocket;
