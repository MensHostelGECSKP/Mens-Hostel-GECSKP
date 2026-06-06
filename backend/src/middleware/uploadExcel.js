const multer = require('multer');

const ALLOWED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream', // Some browsers send binary stream
]);

const ALLOWED_EXT = /\.(xlsx|xls)$/i;
const maxBytes = 5 * 1024 * 1024; // 5MB max file size for bulk import sheets

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const extOk = ALLOWED_EXT.test(file.originalname || '');
    const mimeOk = ALLOWED_MIMES.has(file.mimetype) || file.mimetype === 'application/octet-stream';
    if (extOk && mimeOk) {
      return cb(null, true);
    }
    cb(new Error('INVALID_FILE'));
  },
});

function uploadExcelSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB',
        code: 'VALIDATION_ERROR',
      });
    }
    if (err.message === 'INVALID_FILE') {
      return res.status(400).json({
        error: 'Invalid file type. Allowed: Excel (.xlsx, .xls)',
        code: 'INVALID_FILE',
      });
    }
    next(err);
  });
}

module.exports = { uploadExcelSingle };
