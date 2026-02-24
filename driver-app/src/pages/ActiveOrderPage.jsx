import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getCurrentOrder, pickupOrder, startDelivery, completeOrder } from '../services/api';
import { emitLocationUpdate } from '../services/socket';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ActiveOrderPage.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ActiveOrderPage = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    fetchOrder();
    
    // Location updates
    const locationInterval = setInterval(() => {
      navigator.geolocation?.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLocation(loc);
        emitLocationUpdate(loc.lat, loc.lng);
      });
    }, 5000);

    return () => clearInterval(locationInterval);
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await getCurrentOrder();
      if (!res.data) {
        navigate('/');
        return;
      }
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order:', err);
      navigate('/');
    }
    setLoading(false);
  };

  const handlePickup = async () => {
    setProcessing(true);
    try {
      await pickupOrder(order.id);
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
    setProcessing(false);
  };

  const handleStartDelivery = async () => {
    setProcessing(true);
    try {
      await startDelivery(order.id);
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
    setProcessing(false);
  };

  const handleComplete = async () => {
    if (!otp || otp.length !== 4) {
      alert('Please enter 4-digit OTP');
      return;
    }

    setProcessing(true);
    try {
      const res = await completeOrder(order.id, otp);
      alert(`Order completed! Earned ₹${Number(res.data.earning).toFixed(2)}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP');
    }
    setProcessing(false);
  };

  if (loading) {
    return <div className="active-order-page"><div className="loading">Loading...</div></div>;
  }

  if (!order) {
    return null;
  }

  const mapCenter = order.status === 'accepted' 
    ? [order.hotel.lat, order.hotel.lng]
    : [order.delivery_lat, order.delivery_lng];

  return (
    <div className="active-order-page">
      <div className="order-header">
        <h1>Active Delivery</h1>
        <span className={`status-badge ${order.status}`}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="map-container">
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          style={{ height: '250px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          <Marker position={[order.hotel.lat, order.hotel.lng]}>
            <Popup>🏨 {order.hotel.name}</Popup>
          </Marker>
          
          <Marker position={[order.delivery_lat, order.delivery_lng]}>
            <Popup>📍 Delivery Location</Popup>
          </Marker>
          
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Popup>🚗 You</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="order-info-card">
        {order.status === 'accepted' && (
          <>
            <h3>🏨 Go to Restaurant</h3>
            <p className="restaurant-name">{order.hotel.name}</p>
            <p className="instruction">Pick up the order and mark as collected</p>
            <button 
              className="action-btn pickup"
              onClick={handlePickup}
              disabled={processing}
            >
              {processing ? 'Processing...' : '📦 Reached & Collected'}
            </button>
          </>
        )}

        {order.status === 'picked_up' && (
          <>
            <h3>📍 Deliver to Customer</h3>
            <p className="customer-name">{order.user?.name}</p>
            <p className="instruction">Start delivery to customer location</p>
            <button 
              className="action-btn delivery"
              onClick={handleStartDelivery}
              disabled={processing}
            >
              {processing ? 'Processing...' : '🚗 Start Delivery'}
            </button>
          </>
        )}

        {order.status === 'on_the_way' && (
          <>
            <h3>📍 Complete Delivery</h3>
            <p className="customer-name">{order.user?.name}</p>
            <p className="instruction">Enter OTP from customer to complete</p>
            <input
              type="text"
              className="otp-input"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
            />
            <button 
              className="action-btn complete"
              onClick={handleComplete}
              disabled={processing || otp.length !== 4}
            >
              {processing ? 'Processing...' : '✓ Complete Delivery'}
            </button>
          </>
        )}
      </div>

      <div className="earning-info">
        <span>Earning for this delivery</span>
        <span className="amount">₹{Number(order.driver_earning).toFixed(2)}</span>
      </div>
    </div>
  );
};

export default ActiveOrderPage;
