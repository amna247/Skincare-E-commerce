import { pool } from '../server.js';

export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { items, total_price } = req.body;
    const user_id = req.user.userId;

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, order_date, total_price, order_status) VALUES (?, NOW(), ?, "Pending")',
      [user_id, total_price]
    );

    const order_id = orderResult.insertId;

    // Add order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_Items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [order_id, item.product_id, item.quantity]
      );
    }

    // Clear user's cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

    await connection.commit();
    res.status(201).json({ 
      message: 'Order created successfully',
      order_id: order_id
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  } finally {
    connection.release();
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.product_name,
            'product_price', p.product_price,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_Items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE o.user_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC`,
      [req.user.userId]
    );
    res.json(orders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Error fetching order history' });
  }
}; 