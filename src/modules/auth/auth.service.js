const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../../config/db');
const { jwtSecret } = require('../../config/env');

const signup = async (name, email, password, role = 'user') => {
  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      role,
      is_online: false,
      is_available: true,
      wallet_balance: 0
    })
    .select('id, name, email, role')
    .single();

  if (error) throw error;

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return { user, token };
};

const login = async (email, password) => {
  // Find user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance
    },
    token
  };
};

module.exports = { signup, login };
