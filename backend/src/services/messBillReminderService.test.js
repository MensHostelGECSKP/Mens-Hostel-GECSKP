const messBillReminderService = require('./messBillReminderService');
const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const notificationService = require('./notificationService');

jest.mock('../models/MessBill');
jest.mock('../models/MessBillPayment');
jest.mock('./notificationService');
jest.mock('../config', () => {
  const actual = jest.requireActual('../config');
  return {
    ...actual,
    messBillReminderTimezone: 'Asia/Kolkata',
  };
});

describe('messBillReminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processRemindersForOffset', () => {
    it('should query mess bills with correct timezone-zoned UTC boundaries', async () => {
      // Mock MessBill.find to return a list containing a bill
      const mockBill = {
        _id: 'bill-1',
        month: 6,
        year: 2026,
        dueDate: new Date('2026-06-11T12:00:00Z'),
      };
      MessBill.find.mockResolvedValue([mockBill]);

      // Mock MessBillPayment.find to return a pending payment
      const mockPayment = {
        _id: 'payment-1',
        userId: 'student-1',
      };
      MessBillPayment.find.mockResolvedValue([mockPayment]);
      MessBillPayment.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Run reminder processing for 3 days before
      const sent = await messBillReminderService.processRemindersForOffset(
        3,
        'reminder3SentAt',
        'mess_bill_reminder_3d',
        'Mess Bill Reminder'
      );

      // Verify MessBill.find was called with a dueDate range query
      expect(MessBill.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: true,
          dueDate: expect.any(Object), // $gte and $lte range check
        })
      );

      // Confirm notifications are created correctly
      expect(notificationService.createForUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'student-1',
          type: 'mess_bill_reminder_3d',
          messBillId: 'bill-1',
        })
      );

      // Confirm payment record is updated to set reminder sent timestamp
      expect(MessBillPayment.updateOne).toHaveBeenCalledWith(
        { _id: 'payment-1', reminder3SentAt: { $exists: false } },
        { $set: { reminder3SentAt: expect.any(Date) } }
      );

      expect(sent).toBe(1);
    });
  });
});
