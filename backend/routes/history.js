
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

// All history routes require authentication
router.use(authenticateToken);


// ADD MEDICINE HISTORY
router.post('/', async (req, res) => {
  try {
    const {
      medicine_id,
      intake_date,
      intake_time,
      status,
      notes
    } = req.body;

    if (!medicine_id || !intake_date || !intake_time || !status) {
      return res.status(400).json({
        message: 'Please complete all required history fields.'
      });
    }

    if (!['Taken', 'Missed', 'Skipped'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid intake status.'
      });
    }

    // Check if medicine belongs to the logged-in user
    const [medicines] = await db.promise().query(
      'SELECT id FROM medicines WHERE id = ? AND user_id = ?',
      [medicine_id, req.user.id]
    );

    if (medicines.length === 0) {
      return res.status(404).json({
        message: 'Medicine not found.'
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO medicine_history
      (user_id, medicine_id, intake_date, intake_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        medicine_id,
        intake_date,
        intake_time,
        status,
        notes || null
      ]
    );

    res.status(201).json({
      message: 'Medicine history added successfully!',
      historyId: result.insertId
    });

  } catch (error) {
    console.error('Add history error:', error);

    res.status(500).json({
      message: 'Failed to add medicine history.'
    });
  }
});


// VIEW ALL MEDICINE HISTORY
router.get('/', async (req, res) => {
  try {
    const [history] = await db.promise().query(
      `SELECT mh.*, m.medicine_name
       FROM medicine_history mh
       INNER JOIN medicines m ON mh.medicine_id = m.id
       WHERE mh.user_id = ?
       ORDER BY mh.intake_date DESC, mh.intake_time DESC`,
      [req.user.id]
    );

    res.json({
      message: 'Medicine history retrieved successfully!',
      history: history
    });

  } catch (error) {
    console.error('View history error:', error);

    res.status(500).json({
      message: 'Failed to retrieve medicine history.'
    });
  }
});


// GET TODAY'S INTAKE SUMMARY
router.get('/today-summary', async (req, res) => {
  try {
    const [schedules] = await db.promise().query(
      `SELECT
         ms.medicine_id,
         ms.intake_time
       FROM medicine_schedules ms
       INNER JOIN medicines m ON ms.medicine_id = m.id
       WHERE ms.user_id = ?
         AND m.start_date <= CURDATE()
         AND (m.end_date IS NULL OR m.end_date >= CURDATE())`,
      [req.user.id]
    );

    const [history] = await db.promise().query(
      `SELECT medicine_id, intake_time
       FROM medicine_history
       WHERE user_id = ?
         AND intake_date = CURDATE()
         AND status = 'Taken'`,
      [req.user.id]
    );

    const taken = schedules.filter(schedule =>
      history.some(record =>
        record.medicine_id === schedule.medicine_id &&
        String(record.intake_time).slice(0, 8) ===
        String(schedule.intake_time).slice(0, 8)
      )
    ).length;

    res.json({
      message: "Today's intake summary retrieved successfully!",
      total: schedules.length,
      taken: taken
    });

  } catch (error) {
    console.error("Today's intake summary error:", error);

    res.status(500).json({
      message: "Failed to retrieve today's intake summary."
    });
  }
});


// VIEW ONE MEDICINE HISTORY
router.get('/:id', async (req, res) => {
  try {
    const [history] = await db.promise().query(
      `SELECT mh.*, m.medicine_name
       FROM medicine_history mh
       INNER JOIN medicines m ON mh.medicine_id = m.id
       WHERE mh.id = ? AND mh.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (history.length === 0) {
      return res.status(404).json({
        message: 'Medicine history not found.'
      });
    }

    res.json({
      message: 'Medicine history retrieved successfully!',
      history: history[0]
    });

  } catch (error) {
    console.error('View history error:', error);

    res.status(500).json({
      message: 'Failed to retrieve medicine history.'
    });
  }
});


// UPDATE MEDICINE HISTORY
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'intake_date',
      'intake_time',
      'status',
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
        message: 'No history information provided to update.'
      });
    }

    if (
      req.body.status !== undefined &&
      !['Taken', 'Missed', 'Skipped'].includes(req.body.status)
    ) {
      return res.status(400).json({
        message: 'Invalid intake status.'
      });
    }

    values.push(req.params.id, req.user.id);

    const [result] = await db.promise().query(
      `UPDATE medicine_history
       SET ${updates.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Medicine history not found.'
      });
    }

    res.json({
      message: 'Medicine history updated successfully!'
    });

  } catch (error) {
    console.error('Update history error:', error);

    res.status(500).json({
      message: 'Failed to update medicine history.'
    });
  }
});


// DELETE MEDICINE HISTORY
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.promise().query(
      'DELETE FROM medicine_history WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Medicine history not found.'
      });
    }

    res.json({
      message: 'Medicine history deleted successfully!'
    });

  } catch (error) {
    console.error('Delete history error:', error);

    res.status(500).json({
      message: 'Failed to delete medicine history.'
    });
  }
});

module.exports = router;
