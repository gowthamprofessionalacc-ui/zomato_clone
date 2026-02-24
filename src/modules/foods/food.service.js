const supabase = require('../../config/db');

const getAllFoods = async (filters = {}) => {
  let query = supabase
    .from('foods')
    .select(`
      *,
      hotel:hotels(id, name)
    `);

  if (filters.hotel_id) {
    query = query.eq('hotel_id', filters.hotel_id);
  }

  if (filters.is_veg !== undefined) {
    query = query.eq('is_veg', filters.is_veg);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data;
};

const getFoodById = async (id) => {
  const { data, error } = await supabase
    .from('foods')
    .select(`
      *,
      hotel:hotels(id, name, lat, lng)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

const getFoodsByHotel = async (hotelId) => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('name');

  if (error) throw error;
  return data;
};

module.exports = { getAllFoods, getFoodById, getFoodsByHotel };
