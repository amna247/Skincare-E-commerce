import { pool } from '../server.js';

export const getAllProducts = async (req, res) => {
  try {
    const skinType = req.query.skinType;
    console.log('Fetching products with skinType:', skinType);
    
    let query = `
      SELECT p.*, b.brand_name 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.brand_id
    `;
    
    if (skinType && skinType.toLowerCase() !== 'for you') {
      query += ` WHERE p.product_skintype_preference LIKE ?`;
      console.log('Query with skin type:', query);
      const [products] = await pool.query(query, [`%${skinType}%`]);
      console.log('Found products:', products.length);
      res.json(products);
    } else {
      console.log('Query for all products:', query);
      const [products] = await pool.query(query);
      console.log('Found products:', products.length);
      res.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, b.brand_name 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.brand_id 
      WHERE p.product_id = ?
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { 
      product_name, 
      brand_id, 
      product_price, 
      product_stock, 
      product_quantity,
      product_allergy,
      product_weather_suitability,
      product_skintype_preference 
    } = req.body;

    const [result] = await pool.query(
      'INSERT INTO products (product_name, brand_id, product_price, product_stock, product_quantity, product_allergy, product_weather_suitability, product_skintype_preference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [product_name, brand_id, product_price, product_stock, product_quantity, product_allergy, product_weather_suitability, product_skintype_preference]
    );

    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { 
      product_name, 
      brand_id, 
      product_price, 
      product_stock, 
      product_quantity,
      product_allergy,
      product_weather_suitability,
      product_skintype_preference 
    } = req.body;

    await pool.query(
      'UPDATE products SET product_name = ?, brand_id = ?, product_price = ?, product_stock = ?, product_quantity = ?, product_allergy = ?, product_weather_suitability = ?, product_skintype_preference = ? WHERE product_id = ?',
      [product_name, brand_id, product_price, product_stock, product_quantity, product_allergy, product_weather_suitability, product_skintype_preference, req.params.id]
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

