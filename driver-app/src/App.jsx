import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DriverAuthProvider, useDriverAuth } from './context/DriverAuthContext';
import { DriverSocketProvider } from './context/DriverSocketContext';
import DriverAuthPage from './pages/DriverAuthPage';
import DriverHomePage from './pages/DriverHomePage';
import IncomingOrderPage from './pages/IncomingOrderPage';
import ActiveOrderPage from './pages/ActiveOrderPage';
import WalletPage from './pages/WalletPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useDriverAuth();
  
  if (loading) return <div className="loading-screen">Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useDriverAuth();
  
  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" /> : <DriverAuthPage />} />
      <Route path="/" element={<ProtectedRoute><DriverHomePage /></ProtectedRoute>} />
      <Route path="/incoming-order" element={<ProtectedRoute><IncomingOrderPage /></ProtectedRoute>} />
      <Route path="/active-order" element={<ProtectedRoute><ActiveOrderPage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <DriverAuthProvider>
        <DriverSocketProvider>
          <AppRoutes />
        </DriverSocketProvider>
      </DriverAuthProvider>
    </BrowserRouter>
  );
}

export default App;
