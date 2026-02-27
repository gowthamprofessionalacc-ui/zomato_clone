import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverAuth } from '../context/DriverAuthContext';
import { useDriverSocket } from '../context/DriverSocketContext';
import { goOnline, goOffline, getDriverStats, getCurrentOrder } from '../services/api';
import { emitLocationUpdate } from '../services/socket';
import OnlineToggle from '../components/OnlineToggle';
import './DriverHomePage.css';

const DriverHomePage = () => {
  const { driver, logout } = useDriverAuth();
  const { newOrder, connected } = useDriverSocket();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get location with fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 9.9250, lng: 78.1200 }),
        { timeout: 5000 }
      );
    } else {
      // No geolocation support - use fallback
      setLocation({ lat: 9.9250, lng: 78.1200 });
    }
    
    fetchStats();
    checkActiveOrder();
  }, []);

  const checkActiveOrder = async () => {
    try {
      const res = await getCurrentOrder();
      if (res.data && res.data.id) {
        // Has active order, redirect
        navigate('/active-order', { replace: true });
      }
    } catch (err) {
      // No active order, stay on home
    }
  };

  useEffect(() => {
    // Location update interval when online
    if (isOnline && location) {
      const interval = setInterval(() => {
        navigator.geolocation?.getCurrentPosition((pos) => {
          emitLocationUpdate(pos.coords.latitude, pos.coords.longitude);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, location]);

  useEffect(() => {
    // Navigate to incoming order when received
    if (newOrder) {
      navigate('/incoming-order');
    }
  }, [newOrder, navigate]);

  const fetchStats = async () => {
    try {
      const res = await getDriverStats();
      setStats(res.data);
      setIsOnline(res.data.is_online);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleToggleOnline = async (online) => {
    console.log('Toggle called, location:', location, 'online:', online);
    
    if (!location) {
      alert('Please enable location access');
      return;
    }

    setLoading(true);
    try {
      if (online) {
        console.log('Calling goOnline API...');
        await goOnline(location.lat, location.lng);
      } else {
        console.log('Calling goOffline API...');
        await goOffline();
      }
      console.log('API call successful');
      setIsOnline(online);
    } catch (err) {
      console.error('API call failed:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="driver-home">
      <div className="driver-header">
        <div className="driver-info">
          <div className="driver-avatar">🚗</div>
          <div>
            <h2>{driver?.name}</h2>
            <p>{driver?.email}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="connection-status">
        {connected ? '🟢 Socket Connected' : '🔴 Socket Disconnected'}
      </div>

      <div className="status-card">
        <OnlineToggle 
          isOnline={isOnline} 
          onChange={handleToggleOnline}
          disabled={loading}
        />
        <p className="status-text">
          {isOnline ? '🟢 You are online' : '🔴 You are offline'}
        </p>
      </div>

      {isOnline && (
        <div className="waiting-card">
          <div className="waiting-icon">📦</div>
          <h3>Waiting for orders...</h3>
          <p>Stay online to receive delivery requests</p>
        </div>
      )}

      <div className="stats-card">
        <h3>Today's Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">₹{Number(stats?.wallet_balance || 0).toFixed(2)}</span>
            <span className="stat-label">Earnings</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats?.total_deliveries || 0}</span>
            <span className="stat-label">Deliveries</span>
          </div>
        </div>
      </div>

      <div className="nav-buttons">
        <button onClick={() => navigate('/wallet')}>
          💰 Wallet
        </button>
      </div>
    </div>
  );
};

export default DriverHomePage;
