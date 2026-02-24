const supabase = require('../../config/db');

const getAllHotels = async () => {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

const getHotelById = async (id) => {
  const { data, error } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

module.exports = { getAllHotels, getHotelById };
