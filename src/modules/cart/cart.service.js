const supabase = require('../../config/db');

const getCart = async (userId) => {
  console.log('Getting cart for user:', userId);
  
  // Get the most recent cart for user (in case of duplicates)
  const { data: carts, error: listError } = await supabase
    .from('carts')
    .select(`
      *,
      hotel:hotels(id, name),
      items:cart_items(
        id,
        quantity,
        food:foods(id, name, price, is_veg)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (listError) {
    console.log('Cart list error:', listError);
    throw listError;
  }

  const cart = carts && carts.length > 0 ? carts[0] : null;
  console.log('Cart result:', cart);
  
  return cart;
};

const addToCart = async (userId, foodId, quantity = 1) => {
  console.log('Adding to cart - User:', userId, 'Food:', foodId, 'Qty:', quantity);
  
  // Get food details
  const { data: food, error: foodError } = await supabase
    .from('foods')
    .select('id, hotel_id, price')
    .eq('id', foodId)
    .single();

  console.log('Food found:', food, 'Error:', foodError);
  
  if (foodError || !food) throw new Error('Food not found');

  // Get existing cart (handle multiple carts - get the most recent one)
  const { data: carts } = await supabase
    .from('carts')
    .select('id, hotel_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  let cart = carts && carts.length > 0 ? carts[0] : null;

  let cartReset = false;

  // If cart exists with different hotel, clear it
  if (cart && cart.hotel_id !== food.hotel_id) {
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await supabase.from('carts').delete().eq('id', cart.id);
    cart = null;
    cartReset = true;
  }

  // Create cart if doesn't exist
  if (!cart) {
    const { data: newCart, error: cartError } = await supabase
      .from('carts')
      .insert({
        user_id: userId,
        hotel_id: food.hotel_id
      })
      .select()
      .single();

    if (cartError) throw cartError;
    cart = newCart;
  }

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('food_id', foodId)
    .single();

  if (existingItem) {
    // Update quantity
    await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
  } else {
    // Add new item
    await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        food_id: foodId,
        quantity
      });
  }

  return { cart_reset: cartReset };
};

const updateCartItem = async (userId, itemId, quantity) => {
  // Verify item belongs to user's cart
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) throw new Error('Cart not found');

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', itemId).eq('cart_id', cart.id);
  } else {
    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('cart_id', cart.id);
  }

  return { success: true };
};

const clearCart = async (userId) => {
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (cart) {
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await supabase.from('carts').delete().eq('id', cart.id);
  }

  return { success: true };
};

module.exports = { getCart, addToCart, updateCartItem, clearCart };
