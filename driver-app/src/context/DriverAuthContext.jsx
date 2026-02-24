import { createContext, useContext, useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';

const DriverAuthContext = createContext();

export const useDriverAuth = () => useContext(DriverAuthContext);

export const DriverAuthProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('driver_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedDriver = localStorage.getItem('driver');
    const storedToken = localStorage.getItem('driver_token');
    
    if (storedDriver && storedToken) {
      setDriver(JSON.parse(storedDriver));
      setToken(storedToken);
      connectSocket(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (driverData, authToken) => {
    if (driverData.role !== 'driver') {
      throw new Error('Not a driver account');
    }
    setDriver(driverData);
    setToken(authToken);
    localStorage.setItem('driver', JSON.stringify(driverData));
    localStorage.setItem('driver_token', authToken);
    connectSocket(authToken);
  };

  const logout = () => {
    setDriver(null);
    setToken(null);
    localStorage.removeItem('driver');
    localStorage.removeItem('driver_token');
    disconnectSocket();
  };

  const value = {
    driver,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
};
