import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getOrder, cancelOrder } from '../services/api';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './OrderTrackingPage.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusSteps = [
  { key: 'searching_driver', label: 'Finding Driver', icon: '🔍' },
  { key: 'accepted', label: 'Driver Assigned', icon: '✅' },
  { key: 'picked_up', label: 'Food Picked Up', icon: '📦' },
  { key: 'on_the_way', label: 'On the Way', icon: '🚗' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' }
];

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { orderUpdate, driverLocation, orderCompleted } = useSocket();
  const [driverPos, setDriverPos] = useState(null);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (orderUpdate && orderUpdate.orderId === id) {
      fetchOrder();
    }
  }, [orderUpdate]);

  useEffect(() => {
    if (driverLocation && driverLocation.orderId === id) {
      setDriverPos({ lat: driverLocation.lat, lng: driverLocation.lng });
    }
  }, [driverLocation]);

  useEffect(() => {
    if (orderCompleted && orderCompleted.orderId === id) {
      fetchOrder();
    }
  }, [orderCompleted]);

  const fetchOrder = async () => {
    try {
      const res = await getOrder(id);
      setOrder(res.data);
      if (res.data.driver?.current_lat) {
        setDriverPos({
          lat: res.data.driver.current_lat,
          lng: res.data.driver.current_lng
        });
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    }
    setLoading(false);
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await cancelOrder(id);
      alert('Order cancelled successfully');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="tracking-page">
        <Navbar />
        <div className="loading">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="tracking-page">
        <Navbar />
        <div className="error">Order not found</div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const mapCenter = order.hotel ? [order.hotel.lat, order.hotel.lng] : [9.9252, 78.1198];

  return (
    <div className="tracking-page">
      <Navbar />
      
      <div className="tracking-content">
        <div className="order-header">
          <h1>Order #{order.id.slice(0, 8)}</h1>
          <p>From {order.hotel?.name}</p>
        </div>

        {order.status === 'cancelled' ? (
          <div className="cancelled-banner">
            <h2>❌ Order Cancelled</h2>
            <p>This order has been cancelled</p>
            <button onClick={() => navigate('/')}>Order Again</button>
          </div>
        ) : (
          <>
            <div className="status-tracker">
              {statusSteps.map((step, index) => (
                <div 
                  key={step.key} 
                  className={`status-step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'current' : ''}`}
                >
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-label">{step.label}</div>
                </div>
              ))}
            </div>

            {order.status === 'searching_driver' && (
              <div className="cancel-section">
                <p>No driver assigned yet. You can cancel this order.</p>
                <button 
                  className="cancel-btn" 
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}

            {order.status !== 'delivered' && order.status !== 'searching_driver' && (
              <div className="otp-box">
                <h3>Share this OTP with driver</h3>
                <div className="otp-code">{order.otp}</div>
              </div>
            )}

            {order.driver && (
          <div className="driver-info">
            <h3>Your Delivery Partner</h3>
            <div className="driver-card">
              <div className="driver-avatar">🚗</div>
              <div className="driver-details">
                <h4>{order.driver.name}</h4>
                <p>On the way to you</p>
              </div>
            </div>
          </div>
        )}

        <div className="map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={14} 
            style={{ height: '300px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            
            {order.hotel && (
              <Marker position={[order.hotel.lat, order.hotel.lng]}>
                <Popup>🏨 {order.hotel.name}</Popup>
              </Marker>
            )}
            
            {order.delivery_lat && (
              <Marker position={[order.delivery_lat, order.delivery_lng]}>
                <Popup>📍 Delivery Location</Popup>
              </Marker>
            )}
            
            {driverPos && (
              <Marker position={[driverPos.lat, driverPos.lng]}>
                <Popup>🚗 Driver</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Total Amount</span>
            <span>₹{order.final_amount}</span>
          </div>
          <div className="summary-row">
            <span>Distance</span>
            <span>{order.delivery_distance_km} km</span>
          </div>
        </div>

        {order.status === 'delivered' && (
          <div className="delivered-banner">
            <h2>🎉 Order Delivered!</h2>
            <p>Thank you for ordering</p>
            <button onClick={() => navigate('/')}>Order Again</button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
