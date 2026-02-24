import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../services/api';
import Navbar from '../components/Navbar';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getStatusColor = (status) => {
    const colors = {
      searching_driver: '#FFC107',
      accepted: '#2196F3',
      picked_up: '#9C27B0',
      on_the_way: '#FF9800',
      delivered: '#4CAF50'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-content">
        <div className="profile-header">
          <div className="avatar">👤</div>
          <h1>{user?.name}</h1>
          <p>{user?.email}</p>
        </div>

        <div className="profile-section">
          <h2>Order History</h2>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="no-orders">No orders yet</p>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  className="order-card"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <div className="order-info">
                    <h3>{order.hotel?.name}</h3>
                    <p>₹{order.final_amount} • {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
