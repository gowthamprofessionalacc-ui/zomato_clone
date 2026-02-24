import { useCart } from '../context/CartContext';
import './FoodCard.css';

const FoodCard = ({ food, showHotel = true }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    console.log('Add button clicked for food:', food.id, food.name);
    try {
      await addToCart(food.id);
      console.log('Added to cart successfully');
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add to cart');
    }
  };

  return (
    <div className="food-card">
      <div className="food-info">
        <span className={`veg-badge ${food.is_veg ? 'veg' : 'non-veg'}`}>
          {food.is_veg ? '🟢' : '🔴'}
        </span>
        <div className="food-details">
          <h3>{food.name}</h3>
          {showHotel && food.hotel && (
            <p className="hotel-name">{food.hotel.name}</p>
          )}
          <p className="price">₹{food.price}</p>
        </div>
      </div>
      <button type="button" className="add-btn" onClick={handleAddToCart}>
        ADD
      </button>
    </div>
  );
};

export default FoodCard;
