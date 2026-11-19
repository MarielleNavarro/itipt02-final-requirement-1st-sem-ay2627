
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// SERVE UPLOADED MEDICINE IMAGES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/history', historyRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Medicine Intake Monitoring API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
