-- =============================================
-- ZOMATO CLONE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Users table (includes drivers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'driver')) NOT NULL,
  is_online BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  wallet_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Foods table
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_veg BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  hotel_id UUID REFERENCES hotels(id),
  driver_id UUID REFERENCES users(id),
  status TEXT CHECK (
    status IN (
      'pending',
      'searching_driver',
      'accepted',
      'picked_up',
      'on_the_way',
      'delivered'
    )
  ) NOT NULL,
  total_amount NUMERIC,
  final_amount NUMERIC,
  delivery_distance_km NUMERIC,
  driver_earning NUMERIC,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  otp TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  quantity INT,
  price_at_time NUMERIC
);

-- Driver wallet transactions
CREATE TABLE IF NOT EXISTS driver_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  amount NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_driver_status ON users(is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_foods_hotel ON foods(hotel_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
