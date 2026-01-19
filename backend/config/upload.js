const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const subdirs = ['slideshow', 'products', 'projects', 'news', 'applications'];

subdirs.forEach(subdir => {
  const dir = path.join(uploadDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadDir;
    
    // Determine subdirectory based on route
    if (req.baseUrl.includes('slideshow')) {
      uploadPath = path.join(uploadDir, 'slideshow');
    } else if (req.baseUrl.includes('products')) {
      uploadPath = path.join(uploadDir, 'products');
    } else if (req.baseUrl.includes('projects')) {
      uploadPath = path.join(uploadDir, 'projects');
    } else if (req.baseUrl.includes('news')) {
      uploadPath = path.join(uploadDir, 'news');
    } else if (req.baseUrl.includes('applications')) {
      uploadPath = path.join(uploadDir, 'applications');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;

