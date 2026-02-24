import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, getFoodsByHotel, getActiveOrder } from '../services/api';
import Navbar from '../components/Navbar';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, updateQuantity, clearCart, loading, fetchCart } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [ordering, setOrdering] = useState(false);
  const [location, setLocation] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    // Refresh cart when page loads
    fetchCart();
    checkActiveOrder();
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 9.9300, lng: 78.1200 })
      );
    }
  }, []);

  const checkActiveOrder = async () => {
    try {
      const res = await getActiveOrder();
      setActiveOrder(res.data.activeOrder);
    } catch (err) {
      console.error('Error checking active order:', err);
    }
  };

  useEffect(() => {
    // Load suggestions from same hotel
    if (cart?.hotel_id) {
      loadSuggestions();
    }
  }, [cart]);

  const loadSuggestions = async () => {
    try {
      const res = await getFoodsByHotel(cart.hotel_id);
      const cartFoodIds = cart.items.map(i => i.food.id);
      const filtered = res.data.filter(f => !cartFoodIds.includes(f.id)).slice(0, 4);
      setSuggestions(filtered);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'FLAT10') {
      setDiscount(cartTotal * 0.1);
      alert('Coupon applied! 10% off');
    } else {
      alert('Invalid coupon code');
      setDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!location) {
      alert('Please enable location access');
      return;
    }

    setOrdering(true);
    try {
      const res = await createOrder(
        location.lat,
        location.lng,
        coupon.toUpperCase() === 'FLAT10' ? 'FLAT10' : null
      );
      navigate(`/order/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to place order');
    }
    setOrdering(false);
  };

  console.log('CartPage render - cart:', JSON.stringify(cart), 'loading:', loading);

  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  console.log('Cart check - cart:', JSON.stringify(cart), 'items:', cart?.items, 'length:', cart?.items?.length);

  // DEBUG: Show raw cart data
  if (cart) {
    console.log('Cart exists, items count:', cart.items?.length);
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some delicious food!</p>
          <button onClick={() => navigate('/')}>Browse Restaurants</button>
        </div>
      </div>
    );
  }

  const finalAmount = cartTotal - discount;

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-content">
        {activeOrder && (
          <div className="active-order-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h3>Active Order in Progress</h3>
              <p>Order from {activeOrder.hotel?.name} - Status: {activeOrder.status.replace('_', ' ')}</p>
              <button onClick={() => navigate(`/order/${activeOrder.id}`)}>
                Track Order
              </button>
            </div>
          </div>
        )}

        <div className="cart-header">
          <h1>Your Cart</h1>
          <p>From {cart.hotel?.name}</p>
        </div>

        <div className="cart-items">
          {cart.items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-info">
                <span className={`veg-badge ${item.food.is_veg ? 'veg' : 'non-veg'}`}>
                  {item.food.is_veg ? '🟢' : '🔴'}
                </span>
                <div>
                  <h3>{item.food.name}</h3>
                  <p>₹{item.food.price}</p>
                </div>
              </div>
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div className="item-total">
                ₹{item.food.price * item.quantity}
              </div>
            </div>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions">
            <h3>You might also like</h3>
            <div className="suggestion-list">
              {suggestions.map(food => (
                <div key={food.id} className="suggestion-item">
                  <span>{food.name}</span>
                  <span>₹{food.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="coupon-section">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
          <button onClick={applyCoupon}>Apply</button>
        </div>

        <div className="price-breakdown">
          <div className="price-row">
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          {discount > 0 && (
            <div className="price-row discount">
              <span>Discount (FLAT10)</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total</span>
            <span>₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="payment-method">
          <h3>Payment Method</h3>
          <div className="payment-option selected">
            💵 Cash on Delivery
          </div>
        </div>

        <button 
          className="place-order-btn" 
          onClick={handlePlaceOrder}
          disabled={ordering || activeOrder}
        >
          {ordering ? 'Placing Order...' : activeOrder ? 'Complete Active Order First' : `Place Order • ₹${finalAmount.toFixed(2)}`}
        </button>

        <button className="clear-cart-btn" onClick={clearCart}>
          Clear Cart
        </button>
      </div>
    </div>
  );
};

export default CartPage;
