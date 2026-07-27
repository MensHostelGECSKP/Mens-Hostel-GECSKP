const messBillService = require('../services/messBillService');
const { ERROR_CODES } = require('../constants/errors');
const { logAuditEvent } = require('../utils/auditLogger');

async function publishMessBill(req, res, next) {
  try {
    const { month, year, dueDate, replace } = req.validated;
    const result = await messBillService.publishMessBill({
      month,
      year,
      dueDate,
      file: req.file,
      uploadedBy: req.user.userId,
      replace,
    });
    await logAuditEvent(req, 'MESS_BILL_PUBLISH', { month, year, dueDate, fileName: req.file?.originalname, replace }, result.bill?._id);
    res.status(201).json({
      message: 'Mess bill published',
      bill: result.bill,
      notified: result.notified,
      warnings: result.warnings,
    });
  } catch (err) {
    next(err);
  }
}

async function getAllMessBills(req, res, next) {
  try {
    const bills = await messBillService.getMessBillsForUser(req.user);
    res.json({ bills });
  } catch (err) {
    next(err);
  }
}

async function getMessBillById(req, res, next) {
  try {
    const bill = await messBillService.getMessBillById(req.params.id, req.user);
    res.json({ bill });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'Bill not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    next(err);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { isPaid } = req.validated;
    const result = await messBillService.updatePaymentStatus(
      req.params.id,
      req.user.userId,
      isPaid
    );
    await logAuditEvent(req, 'MESS_BILL_PAYMENT_UPDATE', { billId: req.params.id, isPaid }, req.params.id);
    res.json({
      message: isPaid ? 'Marked as paid' : 'Marked as unpaid',
      ...result,
    });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'Bill not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    next(err);
  }
}

async function deleteMessBill(req, res, next) {
  try {
    await messBillService.deleteMessBill(req.params.id);
    await logAuditEvent(req, 'MESS_BILL_DELETE', { billId: req.params.id }, req.params.id);
    res.json({ message: 'Mess bill deleted' });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'Bill not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    next(err);
  }
}

function sendBillFile(res, bill, buffer, disposition) {
  res.setHeader('Content-Type', bill.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${encodeURIComponent(bill.fileName)}"`
  );
  res.send(buffer);
}

async function respondWithBillFile(req, res, next, disposition) {
  try {
    const access = await messBillService.getBillFileAccess(req.params.id);
    if (access.bill.storageProvider === 'google-drive') {
      const url = disposition === 'inline' ? access.bill.viewUrl : access.bill.downloadUrl;
      return res.json({ url });
    }
    sendBillFile(res, access.bill, access.buffer, disposition);
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: 'Bill not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    }
    if (err.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: 'Bill file not found in storage',
        code: 'FILE_NOT_FOUND',
      });
    }
    next(err);
  }
}

async function viewMessBillFile(req, res, next) {
  return respondWithBillFile(req, res, next, 'inline');
}

async function downloadMessBillFile(req, res, next) {
  return respondWithBillFile(req, res, next, 'attachment');
}

async function triggerReminders(req, res, next) {
  try {
    const { runDailyReminders } = require('../services/messBillReminderService');
    const result = await runDailyReminders();
    await logAuditEvent(req, 'MESS_BILL_REMINDERS_TRIGGER', { totalSent: result.total, r3: result.r3, r1: result.r1 });
    res.json({
      message: `Triggered mess bill reminders. Sent ${result.total} notification(s).`,
      stats: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  publishMessBill,
  getAllMessBills,
  getMessBillById,
  viewMessBillFile,
  downloadMessBillFile,
  updatePaymentStatus,
  deleteMessBill,
  triggerReminders,
};
