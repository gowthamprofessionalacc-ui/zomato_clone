import { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartItem, clearCart as apiClearCart } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getCart();
      console.log('Fetched cart data:', JSON.stringify(res.data, null, 2));
      console.log('Cart items:', res.data?.items);
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const addToCart = async (foodId, quantity = 1) => {
    try {
      const res = await apiAddToCart(foodId, quantity);
      if (res.data.cart_reset) {
        alert('Cart cleared - items from different restaurant');
      }
      await fetchCart();
      return res.data;
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        // Remove item
        await updateCartItem(itemId, 0);
      } else {
        await updateCartItem(itemId, quantity);
      }
      await fetchCart();
    } catch (err) {
      console.error('Error updating cart:', err);
      // Refetch cart anyway to sync state
      await fetchCart();
    }
  };

  const clearCart = async () => {
    try {
      await apiClearCart();
      setCart(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const cartTotal = cart?.items?.reduce((sum, item) => 
    sum + (item.food.price * item.quantity), 0) || 0;

  const cartItemCount = cart?.items?.reduce((sum, item) => 
    sum + item.quantity, 0) || 0;

  const value = {
    cart,
    loading,
    cartTotal,
    cartItemCount,
    addToCart,
    updateQuantity,
    clearCart,
    fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
