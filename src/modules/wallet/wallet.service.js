const supabase = require('../../config/db');

const getWalletBalance = async (driverId) => {
  const { data, error } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', driverId)
    .single();

  if (error) throw error;
  return data;
};

const getTransactions = async (driverId) => {
  const { data, error } = await supabase
    .from('driver_wallet_transactions')
    .select(`
      *,
      order:orders(id, hotel_id, delivery_distance_km)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

module.exports = { getWalletBalance, getTransactions };
