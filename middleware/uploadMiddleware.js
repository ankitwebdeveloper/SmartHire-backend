const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration dynamically routing based on fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'resume') {
      uploadPath += 'resumes/';
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'companyLogo') {
      uploadPath += 'company-logos/';
    }

    // Ensure directory exists synchronously
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize: extract only the extension from the basename, never from a full path
    const safeName = path.basename(file.originalname);
    const ext = path.extname(safeName).toLowerCase();
    const id = req.user ? req.user._id.toString() : 'guest';
    cb(null, `${id}-${Date.now()}${ext}`);
  }
});

// Strict MIME type allowlist — prevents MIME spoofing bypass (e.g. a .php file with mimetype 'application/pdf')
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpg',
  'image/jpeg',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(path.basename(file.originalname)).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only PDF, DOC, DOCX, PNG, and JPG files are allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // Exact 2MB limit
  }
});

module.exports = upload;
