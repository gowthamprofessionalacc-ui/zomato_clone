import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();
  const location = useLocation();

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        🍔 Zomato
      </Link>
      
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          🏠 Home
        </Link>
        <Link 
          to="/cart" 
          className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
        >
          🛒 Cart {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
        </Link>
        <Link 
          to="/profile" 
          className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
        >
          👤 Profile
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
