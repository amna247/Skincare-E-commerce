import { pool } from '../server.js';

export const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.userId;

    // Check if product exists
    const [products] = await pool.query(
      'SELECT * FROM products WHERE product_id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is already in cart
    const [existingItems] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existingItems.length > 0) {
      // Update quantity if product already in cart
      await pool.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      // Add new item to cart
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};

export const getCart = async (req, res) => {
  try {
    const [cartItems] = await pool.query(
      `SELECT c.*, p.product_name, p.product_price 
       FROM cart c 
       JOIN products p ON c.product_id = p.product_id 
       WHERE c.user_id = ?`,
      [req.user.userId]
    );
    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.userId, req.params.productId]
    );
    res.json({ message: 'Product removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, req.user.userId, req.params.productId]
    );
    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart' });
  }
}; 