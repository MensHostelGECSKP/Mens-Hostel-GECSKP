const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { uploadMessBillSingle } = require('../middleware/uploadMessBill');
const {
  validatePublishMessBill,
  validatePaymentStatus,
} = require('../validators/messBillValidator');
const {
  publishMessBill,
  getAllMessBills,
  getMessBillById,
  viewMessBillFile,
  downloadMessBillFile,
  updatePaymentStatus,
  deleteMessBill,
  triggerReminders,
} = require('../controllers/messBillController');

const router = express.Router();

router.post(
  '/publish',
  auth,
  adminOnly,
  csrfProtection,
  uploadMessBillSingle,
  validatePublishMessBill,
  publishMessBill
);

router.post(
  '/reminders/trigger',
  auth,
  adminOnly,
  csrfProtection,
  triggerReminders
);

router.get('/', auth, getAllMessBills);
router.get('/:id/view', auth, viewMessBillFile);
router.get('/:id/download', auth, downloadMessBillFile);
router.get('/:id', auth, getMessBillById);

function studentOnly(req, res, next) {
  if (req.user?.role === 'student') return next();
  return res.status(403).json({
    error: 'Only students can update payment status',
    code: 'ADMIN_REQUIRED',
  });
}

router.patch(
  '/:id/payment',
  auth,
  csrfProtection,
  studentOnly,
  validatePaymentStatus,
  updatePaymentStatus
);

router.delete('/:id', auth, adminOnly, csrfProtection, deleteMessBill);

module.exports = router;
