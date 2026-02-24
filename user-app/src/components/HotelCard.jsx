import './HotelCard.css';

const HotelCard = ({ hotel, onClick }) => {
  return (
    <div className="hotel-card" onClick={onClick}>
      <div className="hotel-image">
        🏨
      </div>
      <div className="hotel-details">
        <h3>{hotel.name}</h3>
        <p>📍 Madurai</p>
      </div>
    </div>
  );
};

export default HotelCard;
