const supabase = require('../../config/db');

const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, wallet_balance, is_online, is_available')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

const updateUser = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = { getUserById, updateUser };
