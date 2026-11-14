const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// VERIFY USER TOKEN
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Access denied. No token provided.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: 'Invalid or expired token.'
      });
    }

    req.user = user;
    next();
  });
}

// All medicine routes require authentication
router.use(authenticateToken);


// ADD MEDICINE
router.post('/', async (req, res) => {
  try {
    const {
      medicine_name,
      dosage,
      category,
      reason,
      start_date,
      end_date,
      image,
      notes
    } = req.body;

    if (!medicine_name || !dosage || !category || !reason || !start_date) {
      return res.status(400).json({
        message: 'Please complete all required medicine fields.'
      });
    }

    if (!['Maintenance', 'Temporary'].includes(category)) {
      return res.status(400).json({
        message: 'Invalid medicine category.'
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO medicines
      (user_id, medicine_name, dosage, category, reason,
       start_date, end_date, image, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        medicine_name,
        dosage,
        category,
        reason,
        start_date,
        end_date || null,
        image || null,
        notes || null
      ]
    );

    res.status(201).json({
      message: 'Medicine added successfully!',
      medicineId: result.insertId
    });

  } catch (error) {
    console.error('Add medicine error:', error);

    res.status(500).json({
      message: 'Failed to add medicine.'
    });
  }
});


// VIEW ALL MEDICINES
router.get('/', async (req, res) => {
  try {
    const [medicines] = await db.promise().query(
      `SELECT * FROM medicines
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: 'Medicine records retrieved successfully!',
      medicines: medicines
    });

  } catch (error) {
    console.error('View medicines error:', error);

    res.status(500).json({
      message: 'Failed to retrieve medicine records.'
    });
  }
});


// VIEW ONE MEDICINE
router.get('/:id', async (req, res) => {
  try {
    const [medicines] = await db.promise().query(
      'SELECT * FROM medicines WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (medicines.length === 0) {
      return res.status(404).json({
        message: 'Medicine not found.'
      });
    }

    res.json({
      message: 'Medicine retrieved successfully!',
      medicine: medicines[0]
    });

  } catch (error) {
    console.error('View medicine error:', error);

    res.status(500).json({
      message: 'Failed to retrieve medicine.'
    });
  }
});


// EDIT MEDICINE
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'medicine_name',
      'dosage',
      'category',
      'reason',
      'start_date',
      'end_date',
      'image',
      'notes'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: 'No medicine information provided to update.'
      });
    }

    if (
      req.body.category !== undefined &&
      !['Maintenance', 'Temporary'].includes(req.body.category)
    ) {
      return res.status(400).json({
        message: 'Invalid medicine category.'
      });
    }

    values.push(req.params.id, req.user.id);

    const [result] = await db.promise().query(
      `UPDATE medicines
       SET ${updates.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Medicine not found.'
      });
    }

    res.json({
      message: 'Medicine updated successfully!'
    });

  } catch (error) {
    console.error('Update medicine error:', error);

    res.status(500).json({
      message: 'Failed to update medicine.'
    });
  }
});


// DELETE MEDICINE
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'DELETE FROM medicines WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Medicine not found.'
      });
    }

    res.json({
      message: 'Medicine deleted successfully!'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);

    res.status(500).json({
      message: 'Failed to delete medicine.'
    });
  }
});

module.exports = router;
