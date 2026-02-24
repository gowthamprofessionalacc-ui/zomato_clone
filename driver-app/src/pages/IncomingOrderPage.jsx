import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverSocket } from '../context/DriverSocketContext';
import { acceptOrder } from '../services/api';
import { emitRejectOrder } from '../services/socket';
import './IncomingOrderPage.css';

const IncomingOrderPage = () => {
  const { newOrder, clearNewOrder } = useDriverSocket();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(15);
  const [accepting, setAccepting] = useState(false);
  const hasRejected = useRef(false);

  const handleReject = useCallback(() => {
    if (hasRejected.current) return;
    hasRejected.current = true;
    
    // Emit reject event to server
    if (newOrder?.orderId) {
      emitRejectOrder(newOrder.orderId);
    }
    
    clearNewOrder();
    navigate('/');
  }, [newOrder, clearNewOrder, navigate]);

  useEffect(() => {
    if (!newOrder) {
      navigate('/');
      return;
    }

    hasRejected.current = false;

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [newOrder, navigate]);

  // Handle timeout separately to avoid setState during render
  useEffect(() => {
    if (timeLeft === 0 && !hasRejected.current) {
      handleReject();
    }
  }, [timeLeft, handleReject]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptOrder(newOrder.orderId);
      clearNewOrder();
      // Navigate after successful accept
      navigate('/active-order', { replace: true });
    } catch (err) {
      setAccepting(false);
      alert(err.response?.data?.error || 'Failed to accept order');
      clearNewOrder();
      navigate('/');
    }
  };

  if (!newOrder) {
    return null;
  }

  return (
    <div className="incoming-order-page">
      <div className="timer-ring">
        <svg viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#eee"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4CAF50"
            strokeWidth="8"
            strokeDasharray={`${(timeLeft / 15) * 283} 283`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="timer-text">{timeLeft}s</div>
      </div>

      <h1>New Order!</h1>

      <div className="order-details">
        <div className="detail-row">
          <span className="label">Restaurant</span>
          <span className="value">{newOrder.hotel?.name}</span>
        </div>
        <div className="detail-row">
          <span className="label">Customer</span>
          <span className="value">{newOrder.user?.name}</span>
        </div>
        <div className="detail-row">
          <span className="label">Distance to Restaurant</span>
          <span className="value">{newOrder.driverToHotelDistance?.toFixed(2)} km</span>
        </div>
        <div className="detail-row">
          <span className="label">Delivery Distance</span>
          <span className="value">{newOrder.hotelToUserDistance?.toFixed(2)} km</span>
        </div>
      </div>

      <div className="earning-box">
        <span className="earning-label">You'll Earn</span>
        <span className="earning-amount">₹{newOrder.earning?.toFixed(2)}</span>
      </div>

      <div className="action-buttons">
        <button 
          className="reject-btn" 
          onClick={handleReject}
          disabled={accepting}
        >
          ✕ Reject
        </button>
        <button 
          className="accept-btn" 
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? 'Accepting...' : '✓ Accept'}
        </button>
      </div>
    </div>
  );
};

export default IncomingOrderPage;
