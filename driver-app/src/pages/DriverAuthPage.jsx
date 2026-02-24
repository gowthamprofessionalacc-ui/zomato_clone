import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverAuth } from '../context/DriverAuthContext';
import { login as apiLogin, signup as apiSignup } from '../services/api';
import './DriverAuthPage.css';

const DriverAuthPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useDriverAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isSignup) {
        res = await apiSignup(name, email, password);
      } else {
        res = await apiLogin(email, password);
        if (res.data.user.role !== 'driver') {
          throw new Error('Not a driver account');
        }
      }
      
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="driver-auth-container">
      <div className="driver-auth-card">
        <div className="auth-logo">🚗</div>
        <h1 className="auth-title">Driver App</h1>
        <p className="auth-subtitle">Zomato Clone</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (isSignup ? 'Signing up...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <p className="auth-toggle" onClick={() => { setIsSignup(!isSignup); setError(''); }}>
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </p>

        <p className="auth-demo">
          Demo: driver1@test.com / driver123
        </p>
      </div>
    </div>
  );
};

export default DriverAuthPage;
