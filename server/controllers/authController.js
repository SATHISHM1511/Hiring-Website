import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { role, email, password } = req.body;
    let { name } = req.body;

    if (role === 'job_seeker' && req.body.first_name && req.body.last_name) {
      name = `${req.body.first_name} ${req.body.last_name}`;
    }

    if (!role || !email || !password) {
      return res.status(400).json({ success: false, message: 'Role, email, and password are required' });
    }

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name || null, email, hashedPassword, role]
    );
    const userId = userResult.insertId;

    if (role === 'recruiter') {
      const { company_name, company_email } = req.body;
      if (!company_name) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Company name is required for recruiter' });
      }
      await connection.execute(
        'INSERT INTO recruiters (user_id, company_name, company_email) VALUES (?, ?, ?)',
        [userId, company_name, company_email || email]
      );
    } else if (role === 'job_seeker') {
      const { first_name, last_name } = req.body;
      if (!first_name || !last_name) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'First name and last name are required' });
      }
      await connection.execute(
        'INSERT INTO job_seekers (user_id, first_name, last_name) VALUES (?, ?, ?)',
        [userId, first_name, last_name]
      );
    }

    await connection.commit();

    const token = generateToken(userId);

    let profile = null;
    if (role === 'recruiter') {
      const [rows] = await pool.execute('SELECT * FROM recruiters WHERE user_id = ?', [userId]);
      profile = rows[0];
    } else {
      const [rows] = await pool.execute('SELECT * FROM job_seekers WHERE user_id = ?', [userId]);
      profile = rows[0];
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: userId, email, role },
      profile,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  } finally {
    connection.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: `No ${role} account found with this email` });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    let profile = null;
    if (user.role === 'recruiter') {
      const [rows] = await pool.execute('SELECT * FROM recruiters WHERE user_id = ?', [user.id]);
      profile = rows[0];
    } else {
      const [rows] = await pool.execute('SELECT * FROM job_seekers WHERE user_id = ?', [user.id]);
      profile = rows[0];
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

export const getMe = async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'recruiter') {
      const [rows] = await pool.execute('SELECT * FROM recruiters WHERE user_id = ?', [req.user.id]);
      profile = rows[0];
    } else {
      const [rows] = await pool.execute('SELECT * FROM job_seekers WHERE user_id = ?', [req.user.id]);
      profile = rows[0];
    }

    res.json({
      success: true,
      user: req.user,
      profile,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};
