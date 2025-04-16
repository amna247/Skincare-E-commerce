import { pool } from '../server.js';

export const addToFavorites = async (req, res) => {
  try {
    const { product_id } = req.body;
    const user_id = req.user.userId;

    // Check if already in favorites
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [user_id, product_id]
    );

    res.json({ message: 'Added to favorites successfully' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Error adding to favorites' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const [favorites] = await pool.query(
      `SELECT f.*, p.product_name, p.product_price 
       FROM favorites f 
       JOIN products p ON f.product_id = p.product_id 
       WHERE f.user_id = ?`,
      [req.user.userId]
    );
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Error fetching favorites' });
  }
};

export const removeFromFavorites = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user.userId, req.params.productId]
    );
    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Error removing from favorites' });
  }
}; 