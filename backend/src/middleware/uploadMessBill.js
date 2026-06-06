const multer = require('multer');
const config = require('../config');

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const ALLOWED_EXT = /\.(pdf|xlsx|xls)$/i;

const maxBytes = config.messBillUploadMaxMb * 1024 * 1024;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const extOk = ALLOWED_EXT.test(file.originalname || '');
    const mimeOk = ALLOWED_MIMES.has(file.mimetype);
    if (extOk && mimeOk) {
      return cb(null, true);
    }
    cb(new Error('INVALID_FILE'));
  },
});

function uploadMessBillSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${config.messBillUploadMaxMb}MB`,
        code: 'VALIDATION_ERROR',
      });
    }
    if (err.message === 'INVALID_FILE') {
      return res.status(400).json({
        error: 'Invalid file type. Allowed: PDF, Excel (.xlsx, .xls)',
        code: 'INVALID_FILE',
      });
    }
    next(err);
  });
}

module.exports = { uploadMessBillSingle };
