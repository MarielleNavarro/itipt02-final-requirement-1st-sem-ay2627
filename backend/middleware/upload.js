
const multer = require('multer');
const path = require('path');

// IMAGE STORAGE CONFIGURATION
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },

    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, `medicine-${uniqueName}${extension}`);
    }
});

// ACCEPT IMAGE FILES ONLY
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'));
  }
};

// MULTER CONFIGURATION
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;