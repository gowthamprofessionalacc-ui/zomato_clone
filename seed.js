require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('./src/config/db');

// Madurai coordinates base
const MADURAI_LAT = 9.9252;
const MADURAI_LNG = 78.1198;

// Generate random offset (±0.02 = ~2km)
const randomOffset = () => (Math.random() - 0.5) * 0.04;

// Hotel names
const hotelNames = [
  'Madurai Biryani House',
  'Meenakshi Mess',
  'Jigarthanda Palace',
  'Chettinad Spice Kitchen',
  'Thalapakattu Biryani',
  'Sri Saravana Bhavan',
  'Murugan Idli Shop',
  'Anjappar Chettinad',
  'Junior Kuppanna',
  'Ponram Restaurant',
  'Kovilpatti Kadalai',
  'Madurai Special Dosa',
  'Temple City Cafe',
  'Raja Mess',
  'Periyar Restaurant',
  'Vaigai Veg Paradise',
  'South Indian Delight',
  'Pandian Hotel',
  'Nellai Mess',
  'Kaaraikudi Kitchen'
];

// Food items per category
const foodItems = {
  biryani: [
    { name: 'Chicken Biryani', price: 180, is_veg: false },
    { name: 'Mutton Biryani', price: 250, is_veg: false },
    { name: 'Veg Biryani', price: 140, is_veg: true },
    { name: 'Egg Biryani', price: 150, is_veg: false },
    { name: 'Mushroom Biryani', price: 160, is_veg: true }
  ],
  dosa: [
    { name: 'Plain Dosa', price: 50, is_veg: true },
    { name: 'Masala Dosa', price: 70, is_veg: true },
    { name: 'Ghee Roast', price: 80, is_veg: true },
    { name: 'Onion Dosa', price: 65, is_veg: true },
    { name: 'Cheese Dosa', price: 90, is_veg: true }
  ],
  idli: [
    { name: 'Idli (2 pcs)', price: 40, is_veg: true },
    { name: 'Idli Sambar', price: 50, is_veg: true },
    { name: 'Mini Idli', price: 60, is_veg: true },
    { name: 'Ghee Pongal', price: 70, is_veg: true },
    { name: 'Rava Idli', price: 55, is_veg: true }
  ],
  rice: [
    { name: 'Curd Rice', price: 60, is_veg: true },
    { name: 'Lemon Rice', price: 70, is_veg: true },
    { name: 'Tamarind Rice', price: 70, is_veg: true },
    { name: 'Coconut Rice', price: 75, is_veg: true },
    { name: 'Tomato Rice', price: 70, is_veg: true }
  ],
  curry: [
    { name: 'Chicken Curry', price: 150, is_veg: false },
    { name: 'Mutton Curry', price: 200, is_veg: false },
    { name: 'Paneer Butter Masala', price: 140, is_veg: true },
    { name: 'Dal Fry', price: 90, is_veg: true },
    { name: 'Egg Curry', price: 100, is_veg: false }
  ],
  snacks: [
    { name: 'Vada (2 pcs)', price: 40, is_veg: true },
    { name: 'Samosa (2 pcs)', price: 30, is_veg: true },
    { name: 'Bajji', price: 50, is_veg: true },
    { name: 'Bonda', price: 40, is_veg: true },
    { name: 'Murukku', price: 60, is_veg: true }
  ],
  meals: [
    { name: 'Veg Meals', price: 100, is_veg: true },
    { name: 'Non-Veg Meals', price: 150, is_veg: false },
    { name: 'Special Thali', price: 180, is_veg: true },
    { name: 'Mini Meals', price: 80, is_veg: true },
    { name: 'Fish Meals', price: 170, is_veg: false }
  ],
  desserts: [
    { name: 'Jigarthanda', price: 60, is_veg: true },
    { name: 'Payasam', price: 50, is_veg: true },
    { name: 'Kesari', price: 40, is_veg: true },
    { name: 'Ice Cream', price: 50, is_veg: true },
    { name: 'Gulab Jamun', price: 45, is_veg: true }
  ],
  drinks: [
    { name: 'Filter Coffee', price: 30, is_veg: true },
    { name: 'Tea', price: 20, is_veg: true },
    { name: 'Buttermilk', price: 25, is_veg: true },
    { name: 'Lassi', price: 50, is_veg: true },
    { name: 'Fresh Lime Soda', price: 40, is_veg: true }
  ],
  rotis: [
    { name: 'Chapati (2 pcs)', price: 30, is_veg: true },
    { name: 'Parotta (2 pcs)', price: 40, is_veg: true },
    { name: 'Naan', price: 35, is_veg: true },
    { name: 'Butter Naan', price: 45, is_veg: true },
    { name: 'Kothu Parotta', price: 100, is_veg: false }
  ]
};

// Driver data
const drivers = [
  { name: 'Murugan', email: 'driver1@test.com' },
  { name: 'Senthil', email: 'driver2@test.com' },
  { name: 'Rajesh', email: 'driver3@test.com' },
  { name: 'Kumar', email: 'driver4@test.com' },
  { name: 'Suresh', email: 'driver5@test.com' }
];

const seed = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('driver_wallet_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('carts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('foods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hotels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create hotels
    console.log('🏨 Creating hotels...');
    const hotelsToInsert = hotelNames.map(name => ({
      name,
      lat: MADURAI_LAT + randomOffset(),
      lng: MADURAI_LNG + randomOffset()
    }));

    const { data: hotels, error: hotelError } = await supabase
      .from('hotels')
      .insert(hotelsToInsert)
      .select();

    if (hotelError) throw hotelError;
    console.log(`   ✅ Created ${hotels.length} hotels\n`);

    // Create foods (5 items per hotel = 100 total)
    console.log('🍔 Creating food items...');
    const categories = Object.keys(foodItems);
    const foodsToInsert = [];

    hotels.forEach((hotel, index) => {
      // Each hotel gets foods from 2-3 random categories
      const numCategories = 2 + Math.floor(Math.random() * 2);
      const selectedCategories = [];
      
      for (let i = 0; i < numCategories; i++) {
        const cat = categories[(index + i) % categories.length];
        selectedCategories.push(cat);
      }

      let itemCount = 0;
      for (const cat of selectedCategories) {
        const items = foodItems[cat];
        for (const item of items) {
          if (itemCount >= 5) break;
          foodsToInsert.push({
            hotel_id: hotel.id,
            name: item.name,
            price: item.price,
            is_veg: item.is_veg
          });
          itemCount++;
        }
        if (itemCount >= 5) break;
      }
    });

    const { data: foods, error: foodError } = await supabase
      .from('foods')
      .insert(foodsToInsert)
      .select();

    if (foodError) throw foodError;
    console.log(`   ✅ Created ${foods.length} food items\n`);

    // Create drivers
    console.log('🚗 Creating drivers...');
    const passwordHash = await bcrypt.hash('driver123', 10);
    
    const driversToInsert = drivers.map(driver => ({
      name: driver.name,
      email: driver.email,
      password_hash: passwordHash,
      role: 'driver',
      is_online: false,
      is_available: true,
      current_lat: MADURAI_LAT + randomOffset(),
      current_lng: MADURAI_LNG + randomOffset(),
      wallet_balance: 0
    }));

    const { data: createdDrivers, error: driverError } = await supabase
      .from('users')
      .insert(driversToInsert)
      .select('id, name, email');

    if (driverError) throw driverError;
    console.log(`   ✅ Created ${createdDrivers.length} drivers\n`);

    // Create a test user
    console.log('👤 Creating test user...');
    const userPasswordHash = await bcrypt.hash('user123', 10);
    
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        email: 'user@test.com',
        password_hash: userPasswordHash,
        role: 'user'
      })
      .select('id, name, email')
      .single();

    if (userError) throw userError;
    console.log(`   ✅ Created test user\n`);

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SEED COMPLETE!\n');
    console.log('📋 TEST ACCOUNTS:');
    console.log('───────────────────────────────────────────');
    console.log('👤 User:');
    console.log('   Email: user@test.com');
    console.log('   Password: user123\n');
    console.log('🚗 Drivers (all password: driver123):');
    createdDrivers.forEach(d => {
      console.log(`   ${d.name}: ${d.email}`);
    });
    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
