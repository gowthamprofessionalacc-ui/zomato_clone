import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFoodsByHotel, getHotel } from '../services/api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import FoodCard from '../components/FoodCard';
import './HotelPage.css';

const HotelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItemCount } = useCart();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotelRes, foodsRes] = await Promise.all([
        getHotel(id),
        getFoodsByHotel(id)
      ]);
      setHotel(hotelRes.data);
      setFoods(foodsRes.data);
    } catch (err) {
      console.error('Error fetching hotel:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="hotel-page">
        <Navbar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="hotel-page">
      <Navbar />
      
      <div className="hotel-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="hotel-info">
          <h1>{hotel?.name}</h1>
          <p>📍 Madurai • {foods.length} items</p>
        </div>
      </div>

      <div className="hotel-foods">
        <h2>Menu</h2>
        <div className="foods-list">
          {foods.map(food => (
            <FoodCard key={food.id} food={food} showHotel={false} />
          ))}
        </div>
      </div>

      {cartItemCount > 0 && (
        <div className="cart-float" onClick={() => navigate('/cart')}>
          🛒 {cartItemCount} items • View Cart
        </div>
      )}
    </div>
  );
};

export default HotelPage;
