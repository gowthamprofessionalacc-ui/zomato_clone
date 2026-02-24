import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [orderUpdate, setOrderUpdate] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    socket.on('order:update', (data) => {
      console.log('Order update:', data);
      setOrderUpdate(data);
    });

    socket.on('driver:location', (data) => {
      console.log('Driver location:', data);
      setDriverLocation(data);
    });

    socket.on('order:completed', (data) => {
      console.log('Order completed:', data);
      setOrderCompleted(data);
    });

    return () => {
      socket.off('order:update');
      socket.off('driver:location');
      socket.off('order:completed');
    };
  }, [isAuthenticated]);

  const value = {
    orderUpdate,
    driverLocation,
    orderCompleted,
    clearOrderUpdate: () => setOrderUpdate(null),
    clearDriverLocation: () => setDriverLocation(null),
    clearOrderCompleted: () => setOrderCompleted(null)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
