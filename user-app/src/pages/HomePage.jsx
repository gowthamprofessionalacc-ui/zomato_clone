import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHotels, getFoods } from '../services/api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import HotelCard from '../components/HotelCard';
import FoodCard from '../components/FoodCard';
import VegToggle from '../components/VegToggle';
import './HomePage.css';

const HomePage = () => {
  const [hotels, setHotels] = useState([]);
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hotels');
  
  const navigate = useNavigate();
  const { cartItemCount } = useCart();

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 9.9252, lng: 78.1198 }) // Default Madurai
      );
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, foodsRes] = await Promise.all([
        getHotels(),
        getFoods()
      ]);
      setHotels(hotelsRes.data);
      setFoods(foodsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) ||
                         food.hotel?.name.toLowerCase().includes(search.toLowerCase());
    const matchesVeg = !vegOnly || food.is_veg;
    return matchesSearch && matchesVeg;
  });

  return (
    <div className="home-page">
      <Navbar />
      
      <div className="home-header">
        <div className="location-bar">
          📍 {location ? 'Madurai' : 'Getting location...'}
        </div>
        
        <input
          type="text"
          className="search-bar"
          placeholder="Search for restaurants or food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="home-controls">
          <VegToggle checked={vegOnly} onChange={setVegOnly} />
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'hotels' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotels')}
        >
          🏨 Restaurants
        </button>
        <button 
          className={`tab ${activeTab === 'foods' ? 'active' : ''}`}
          onClick={() => setActiveTab('foods')}
        >
          🍔 Foods
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="content">
          {activeTab === 'hotels' ? (
            <div className="hotels-grid">
              {filteredHotels.map(hotel => (
                <HotelCard 
                  key={hotel.id} 
                  hotel={hotel}
                  onClick={() => navigate(`/hotel/${hotel.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="foods-grid">
              {filteredFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>
      )}

      {cartItemCount > 0 && (
        <div className="cart-float" onClick={() => navigate('/cart')}>
          🛒 {cartItemCount} items in cart
        </div>
      )}
    </div>
  );
};

export default HomePage;
