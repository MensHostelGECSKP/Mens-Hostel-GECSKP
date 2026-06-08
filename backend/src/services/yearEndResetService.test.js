const yearEndResetService = require('./yearEndResetService');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const MessBill = require('../models/MessBill');
const MessBillPayment = require('../models/MessBillPayment');
const Notification = require('../models/Notification');
const UserNotificationState = require('../models/UserNotificationState');
const NotificationMetric = require('../models/NotificationMetric');
const PushSubscription = require('../models/PushSubscription');
const messBillService = require('./messBillService');
const mongoose = require('mongoose');

jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    inTransaction: jest.fn().mockReturnValue(true),
    endSession: jest.fn(),
  };
  return {
    ...original,
    startSession: jest.fn().mockResolvedValue(mockSession),
  };
});

jest.mock('../models/User');
jest.mock('../models/Attendance');
jest.mock('../models/MessBill');
jest.mock('../models/MessBillPayment');
jest.mock('../models/Notification');
jest.mock('../models/UserNotificationState');
jest.mock('../models/NotificationMetric');
jest.mock('../models/PushSubscription');
jest.mock('./messBillService');

describe('yearEndResetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('performYearEndReset', () => {
    it('should successfully clear operational and auxiliary collections and pass options to storage provider', async () => {
      // Mock student users list
      const mockStudents = [{ _id: 'student-id-1' }, { _id: 'student-id-2' }];
      User.find.mockResolvedValue(mockStudents);

      // Mock delete results
      Attendance.deleteMany.mockResolvedValue({ deletedCount: 10 });
      MessBillPayment.deleteMany.mockResolvedValue({ deletedCount: 5 });
      MessBill.deleteMany.mockResolvedValue({ deletedCount: 2 });
      Notification.deleteMany.mockResolvedValue({ deletedCount: 20 });
      User.deleteMany.mockResolvedValue({ deletedCount: 2 });
      UserNotificationState.deleteMany.mockResolvedValue({ deletedCount: 15 });
      NotificationMetric.deleteMany.mockResolvedValue({ deletedCount: 4 });
      PushSubscription.deleteMany.mockResolvedValue({ deletedCount: 2 });

      // Run year end reset with deleteDriveFiles option set to true
      const result = await yearEndResetService.performYearEndReset(true);

      // Verify stats retrieved and returned
      expect(User.find).toHaveBeenCalledWith({ role: 'student' }, '_id', expect.any(Object));
      
      // Verify storage provider delete called with options
      expect(messBillService.removeAllStoredFiles).toHaveBeenCalledWith({ deleteDriveFiles: true });

      // Verify operational data deleted
      expect(Attendance.deleteMany).toHaveBeenCalled();
      expect(MessBillPayment.deleteMany).toHaveBeenCalled();
      expect(MessBill.deleteMany).toHaveBeenCalled();
      expect(Notification.deleteMany).toHaveBeenCalled();
      expect(User.deleteMany).toHaveBeenCalledWith({ role: 'student' }, expect.any(Object));

      // Verify auxiliary data deleted (Issue 6)
      expect(UserNotificationState.deleteMany).toHaveBeenCalled();
      expect(NotificationMetric.deleteMany).toHaveBeenCalled();
      expect(PushSubscription.deleteMany).toHaveBeenCalledWith(
        { userId: { $in: ['student-id-1', 'student-id-2'] } },
        expect.any(Object)
      );

      // Verify output summary matches deletedCount mapping
      expect(result).toEqual({
        deleted: {
          residents: 2,
          attendance: 10,
          messBills: 2,
          messBillPayments: 5,
          notifications: 20,
        },
      });
    });
  });
});
