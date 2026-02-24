import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;
  
  socket = io(SOCKET_URL, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Driver socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Driver socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Emit events
export const emitGoOnline = (lat, lng) => {
  if (socket) socket.emit('driver:go-online', { lat, lng });
};

export const emitGoOffline = () => {
  if (socket) socket.emit('driver:go-offline');
};

export const emitLocationUpdate = (lat, lng) => {
  if (socket) socket.emit('driver:location:update', { lat, lng });
};

export const emitAcceptOrder = (orderId) => {
  if (socket) socket.emit('order:accept', { orderId });
};

export const emitRejectOrder = (orderId) => {
  if (socket) socket.emit('order:reject', { orderId });
};

export const emitPickup = (orderId) => {
  if (socket) socket.emit('order:pickup', { orderId });
};

export const emitStartDelivery = (orderId) => {
  if (socket) socket.emit('order:start-delivery', { orderId });
};

export const emitComplete = (orderId, otp) => {
  if (socket) socket.emit('order:complete', { orderId, otp });
};

export default { connectSocket, disconnectSocket, getSocket };
