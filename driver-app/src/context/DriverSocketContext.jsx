import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import { useDriverAuth } from './DriverAuthContext';

const DriverSocketContext = createContext();

export const useDriverSocket = () => useContext(DriverSocketContext);

export const DriverSocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useDriverAuth();
  const [newOrder, setNewOrder] = useState(null);
  const [orderUpdate, setOrderUpdate] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Ensure socket is connected
    const socket = connectSocket(token);
    if (!socket) return;

    const handleConnect = () => {
      console.log('Driver socket connected!');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Driver socket disconnected');
      setConnected(false);
    };

    const handleNewOrder = (data) => {
      console.log('🔔 New order received:', data);
      setNewOrder(data);
    };

    const handleOrderUpdate = (data) => {
      console.log('Order update:', data);
      setOrderUpdate(data);
    };

    const handleOrderAccepted = (data) => {
      console.log('Order accepted:', data);
      setNewOrder(null);
    };

    const handleOrderCompleted = (data) => {
      console.log('Order completed:', data);
    };

    const handleError = (data) => {
      console.error('Socket error:', data.message);
      alert(data.message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('order:new', handleNewOrder);
    socket.on('order:update', handleOrderUpdate);
    socket.on('order:accepted', handleOrderAccepted);
    socket.on('order:completed', handleOrderCompleted);
    socket.on('error', handleError);

    // Check if already connected
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('order:new', handleNewOrder);
      socket.off('order:update', handleOrderUpdate);
      socket.off('order:accepted', handleOrderAccepted);
      socket.off('order:completed', handleOrderCompleted);
      socket.off('error', handleError);
    };
  }, [isAuthenticated, token]);

  const value = {
    newOrder,
    orderUpdate,
    connected,
    clearNewOrder: () => setNewOrder(null)
  };

  return (
    <DriverSocketContext.Provider value={value}>
      {children}
    </DriverSocketContext.Provider>
  );
};
