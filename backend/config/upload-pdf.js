const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const applicationsDir = path.join(uploadDir, 'applications');

if (!fs.existsSync(applicationsDir)) {
  fs.mkdirSync(applicationsDir, { recursive: true });
}

// Storage configuration for PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, applicationsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cv-' + uniqueSuffix + ext);
  }
});

// File filter for PDFs only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Multer configuration for PDF uploads
const uploadPDF = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for CVs
  },
  fileFilter: fileFilter
});

module.exports = uploadPDF;

