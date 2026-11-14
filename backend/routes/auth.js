const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// USER REGISTRATION
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, username, password } = req.body;

    if (!first_name || !last_name || !username || !password) {
      return res.status(400).json({
        message: 'Please complete all required fields.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.'
      });
    }

    const [existingUser] = await db.promise().query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'Username already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique recovery code
    const recoveryCode = crypto.randomBytes(4)
      .toString('hex')
      .toUpperCase();

    const hashedRecoveryCode = await bcrypt.hash(recoveryCode, 10);

    const [result] = await db.promise().query(
      `INSERT INTO users
      (first_name, last_name, username, password, recovery_code)
      VALUES (?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        username,
        hashedPassword,
        hashedRecoveryCode
      ]
    );

    res.status(201).json({
      message: 'Registration successful!',
      userId: result.insertId,
      recoveryCode: recoveryCode
    });

  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Registration failed.'
    });
  }
});


// USER LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Please enter your username and password.'
      });
    }

    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid username or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Login failed.'
    });
  }
});


// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, recoveryCode, newPassword } = req.body;

    if (!username || !recoveryCode || !newPassword) {
      return res.status(400).json({
        message: 'Please complete all required fields.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters.'
      });
    }

    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'Invalid username or recovery code.'
      });
    }

    const user = users[0];

    const recoveryMatch = await bcrypt.compare(
      recoveryCode,
      user.recovery_code
    );

    if (!recoveryMatch) {
      return res.status(400).json({
        message: 'Invalid username or recovery code.'
      });
    }

    // Generate a new recovery code after password reset
    const newRecoveryCode = crypto.randomBytes(4)
      .toString('hex')
      .toUpperCase();

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const hashedRecoveryCode = await bcrypt.hash(newRecoveryCode, 10);

    await db.promise().query(
      `UPDATE users
       SET password = ?, recovery_code = ?
       WHERE id = ?`,
      [
        hashedPassword,
        hashedRecoveryCode,
        user.id
      ]
    );

    res.json({
      message: 'Password reset successful!',
      recoveryCode: newRecoveryCode
    });

  } catch (error) {
    console.error('Password reset error:', error);

    res.status(500).json({
      message: 'Password reset failed.'
    });
  }
});

module.exports = router;
