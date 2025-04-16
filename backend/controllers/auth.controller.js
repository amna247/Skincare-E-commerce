import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    console.log('Registration attempt for:', email);

    // Check if user already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      console.log('Registration failed: User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );

    console.log('User registered successfully:', email);

    // Generate token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: result.insertId,
      token,
      user: {
        id: result.insertId,
        username,
        email,
        full_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('User found:', users.length > 0);

    if (users.length === 0) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('Comparing passwords for user:', email);

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', email);

    res.json({ 
      token, 
      user: { 
        id: user.user_id,
        username: user.username,
        email: user.email,
        skin_type: user.skin_type,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: error.message 
    });
  }
};

export const updateAdditionalInfo = async (req, res) => {
  try {
    console.log('Updating additional info:', req.body);
    const { age, allergies, skin_type } = req.body;
    const { email } = req.user; // Get email from JWT token

    // Update user information
    const [result] = await pool.query(
      'UPDATE users SET age = ?, allergies = ?, skin_type = ? WHERE email = ?',
      [age, allergies, skin_type, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Additional info updated successfully for:', email);
    res.json({ 
      message: 'Additional info updated successfully',
      user: {
        age,
        allergies,
        skin_type
      }
    });
  } catch (error) {
    console.error('Additional info update error:', error);
    res.status(500).json({ 
      message: 'Error updating additional info',
      error: error.message 
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    delete user.password; // Don't send password to client
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, full_name, age, skin_type, allergies } = req.body;
    
    await pool.query(
      'UPDATE users SET username = ?, full_name = ?, age = ?, skin_type = ?, allergies = ? WHERE user_id = ?',
      [username, full_name, age, skin_type, allergies, req.user.userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = ?', [req.user.userId]);
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ message: 'Error deleting profile' });
  }
};


