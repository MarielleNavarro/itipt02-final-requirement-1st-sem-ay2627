const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const upload = require('../middleware/upload');

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
router.post('/', upload.single('image'), async (req, res) => {
  const connection = db.promise();

  try {
    const {
      medicine_name,
      dosage,
      category,
      reason,
      start_date,
      end_date,
      notes,
      intake_times
    } = req.body;

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.image || null);

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

    // PARSE INTAKE TIMES FROM FORMDATA
    let parsedIntakeTimes;

    try {
      parsedIntakeTimes = typeof intake_times === 'string'
        ? JSON.parse(intake_times)
        : intake_times;
    } catch {
      return res.status(400).json({
        message: 'Invalid intake schedule data.'
      });
    }

    // VALIDATE INTAKE SCHEDULES
    if (!Array.isArray(parsedIntakeTimes) || parsedIntakeTimes.length === 0) {
      return res.status(400).json({
        message: 'Please add at least one intake schedule.'
      });
    }

    const validTimeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!parsedIntakeTimes.every(time =>
      typeof time === 'string' && validTimeFormat.test(time)
    )) {
      return res.status(400).json({
        message: 'Invalid intake schedule time.'
      });
    }

    const uniqueIntakeTimes = [...new Set(parsedIntakeTimes)];

    // START DATABASE TRANSACTION
    await connection.beginTransaction();

    // SAVE MEDICINE
    const [result] = await connection.query(
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

    const medicineId = result.insertId;

    // SAVE INTAKE SCHEDULES
    for (const time of uniqueIntakeTimes) {
      await connection.query(
        `INSERT INTO medicine_schedules
        (user_id, medicine_id, intake_time)
        VALUES (?, ?, ?)`,
        [
          req.user.id,
          medicineId,
          `${time}:00`
        ]
      );
    }

    // SAVE ALL CHANGES
    await connection.commit();

    res.status(201).json({
      message: 'Medicine and intake schedules added successfully!',
      medicineId: medicineId
    });

  } catch (error) {
    await connection.rollback();

    console.error('Add medicine error:', error);

    res.status(500).json({
      message: 'Failed to add medicine and intake schedules.'
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


// GET TODAY'S UPCOMING MEDICINE SCHEDULES
router.get('/today-schedules', async (req, res) => {
  try {
    const [schedules] = await db.promise().query(
      `SELECT
         ms.medicine_id,
         m.medicine_name,
         m.dosage,
         m.image,
         ms.intake_time,
         (
           SELECT mh.status
           FROM medicine_history mh
           WHERE mh.medicine_id = ms.medicine_id
             AND mh.user_id = ms.user_id
             AND mh.intake_date = CURDATE()
             AND mh.intake_time = ms.intake_time
           ORDER BY mh.id DESC
           LIMIT 1
         ) AS status
       FROM medicine_schedules ms
       INNER JOIN medicines m
         ON ms.medicine_id = m.id
       WHERE ms.user_id = ?
         AND m.start_date <= CURDATE()
         AND (m.end_date IS NULL OR m.end_date >= CURDATE())
       ORDER BY ms.intake_time ASC`,
      [req.user.id]
    );

    res.json({
      message: "Today's medicine schedules retrieved successfully!",
      schedules: schedules
    });

  } catch (error) {
    console.error("Today's schedules error:", error);

    res.status(500).json({
      message: "Failed to retrieve today's medicine schedules."
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
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('UPDATE BODY:', req.body);
    console.log('UPDATE FILE:', req.file);

    // SAVE NEW MEDICINE IMAGE PATH
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

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
