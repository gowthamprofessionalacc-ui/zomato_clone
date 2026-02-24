# 🍔 Zomato Clone - Backend

A production-style food delivery backend with real-time driver matching.

## Tech Stack
- Node.js + Express
- Socket.io (real-time)
- Supabase (PostgreSQL)
- JWT + bcrypt (auth)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
Copy the contents of `database.sql` and run it in your **Supabase SQL Editor**.

### 3. Seed Data
```bash
npm run seed
```

### 4. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## Test Accounts

| Role   | Email            | Password  |
|--------|------------------|-----------|
| User   | user@test.com    | user123   |
| Driver | driver1@test.com | driver123 |
| Driver | driver2@test.com | driver123 |
| Driver | driver3@test.com | driver123 |
| Driver | driver4@test.com | driver123 |
| Driver | driver5@test.com | driver123 |

## API Endpoints

### Auth
- `POST /auth/signup` - Register user/driver
- `POST /auth/login` - Login

### Hotels & Foods
- `GET /hotels` - List all hotels
- `GET /hotels/:id` - Get hotel details
- `GET /foods` - List all foods (filters: hotel_id, is_veg, search)
- `GET /foods/hotel/:hotelId` - Foods by hotel

### Cart (User only)
- `GET /cart` - Get cart
- `POST /cart` - Add to cart
- `PUT /cart/item/:itemId` - Update quantity
- `DELETE /cart` - Clear cart

### Orders (User only)
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order details

### Driver
- `POST /driver/go-online` - Go online
- `POST /driver/go-offline` - Go offline
- `POST /driver/location` - Update location
- `GET /driver/current-order` - Get active order
- `GET /driver/stats` - Get driver stats
- `POST /driver/order/:id/accept` - Accept order
- `POST /driver/order/:id/pickup` - Mark pickup
- `POST /driver/order/:id/start-delivery` - Start delivery
- `POST /driver/order/:id/complete` - Complete with OTP

### Wallet (Driver only)
- `GET /wallet/balance` - Get balance
- `GET /wallet/transactions` - Get transactions

## WebSocket Events

### Driver Events (emit)
- `driver:go-online` - `{ lat, lng }`
- `driver:go-offline`
- `driver:location:update` - `{ lat, lng }`
- `order:accept` - `{ orderId }`
- `order:pickup` - `{ orderId }`
- `order:start-delivery` - `{ orderId }`
- `order:complete` - `{ orderId, otp }`

### Server Events (receive)
- `order:new` - New order request
- `order:update` - Order status change
- `order:accepted` - Order accepted
- `order:completed` - Order delivered
- `driver:location` - Driver location update

## Order Flow
1. User places order → `searching_driver`
2. System finds nearest available driver
3. Driver has 15 sec to accept
4. If timeout → next nearest driver
5. Driver accepts → `accepted`
6. Driver picks up → `picked_up`
7. Driver starts delivery → `on_the_way`
8. Driver enters OTP → `delivered`
9. Wallet credited

## Coupon Code
- `FLAT10` - 10% off
