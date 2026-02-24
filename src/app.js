const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const hotelRoutes = require('./modules/hotels/hotel.routes');
const foodRoutes = require('./modules/foods/food.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/order.routes');
const driverRoutes = require('./modules/drivers/driver.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://zomato-user-app.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/hotels', hotelRoutes);
app.use('/foods', foodRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/driver', driverRoutes);
app.use('/wallet', walletRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
