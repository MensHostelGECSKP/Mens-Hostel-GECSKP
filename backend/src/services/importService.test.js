const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config', () => ({
  emailUser: 'mh-app@example.com',
  emailPass: 'test-pass',
  smtpHost: 'smtp.example.com',
  smtpPort: 465,
  smtpSecure: true,
  frontendUrl: 'http://localhost:3000',
}));

const mockUserModel = jest.fn().mockImplementation(function userConstructor(data) {
  Object.assign(this, data);
  this._id = this._id || `user-${mockUserModel.mock.instances.length + 1}`;
  this.save = jest.fn().mockResolvedValue(undefined);
});
mockUserModel.find = jest.fn();

jest.mock('../models/User', () => mockUserModel);

const importService = require('./importService');

describe('importService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({});
  });

  describe('normalizeYearOfStudy', () => {
    it('should strip "year" prefix case-insensitively and trim spaces', () => {
      expect(importService.normalizeYearOfStudy('year 3')).toBe('3');
      expect(importService.normalizeYearOfStudy('Year 4')).toBe('4');
      expect(importService.normalizeYearOfStudy('YEAR  1')).toBe('1');
      expect(importService.normalizeYearOfStudy('2')).toBe('2');
      expect(importService.normalizeYearOfStudy(undefined)).toBe('');
      expect(importService.normalizeYearOfStudy(null)).toBe('');
    });
  });

  describe('getUsernameFromEmail', () => {
    it('should return local part before @ in lowercase', () => {
      expect(importService.getUsernameFromEmail('Sabari.Santhosh45@example.com')).toBe('sabari.santhosh45');
      expect(importService.getUsernameFromEmail('admin@gecskp.ac.in')).toBe('admin');
      expect(importService.getUsernameFromEmail('invalid-email')).toBe('');
      expect(importService.getUsernameFromEmail('')).toBe('');
    });
  });

  describe('validateData', () => {
    it('should correctly flag missing fields', async () => {
      mockUserModel.find.mockResolvedValue([]); // No existing users in DB

      const testRows = [
        { rowNumber: 2, name: '', yearOfStudy: '3', roomNumber: '313', email: 'a@example.com' },
        { rowNumber: 3, name: 'John', yearOfStudy: '', roomNumber: '313', email: 'b@example.com' },
        { rowNumber: 4, name: 'Doe', yearOfStudy: '3', roomNumber: '313', email: '' },
      ];

      const result = await importService.validateData(testRows);

      expect(result.totalRows).toBe(3);
      expect(result.validRowsCount).toBe(0);
      expect(result.invalidRowsCount).toBe(3);
      expect(result.rowErrors).toHaveLength(3);
      expect(result.rowErrors[0].errors).toContain('Missing Name');
      expect(result.rowErrors[1].errors).toContain('Missing Year');
      expect(result.rowErrors[2].errors).toContain('Missing Email');
    });

    it('should flag invalid year or email format', async () => {
      mockUserModel.find.mockResolvedValue([]);

      const testRows = [
        { rowNumber: 2, name: 'Alice', yearOfStudy: '5', roomNumber: '313', email: 'alice@example.com' },
        { rowNumber: 3, name: 'Bob', yearOfStudy: '2', roomNumber: '313', email: 'invalid-email' },
      ];

      const result = await importService.validateData(testRows);

      expect(result.validRowsCount).toBe(0);
      expect(result.invalidRowsCount).toBe(2);
      expect(result.rowErrors[0].errors).toContain('Invalid Year');
      expect(result.rowErrors[1].errors).toContain('Invalid Email');
    });

    it('should detect in-file duplicates', async () => {
      mockUserModel.find.mockResolvedValue([]);

      const testRows = [
        { rowNumber: 2, name: 'Alice', yearOfStudy: '3', roomNumber: '101', email: 'alice@example.com' }, // Unique
        { rowNumber: 3, name: 'Bob', yearOfStudy: '2', roomNumber: '102', email: 'bob@example.com' }, // Duplicate email/username
        { rowNumber: 4, name: 'Bob Dup', yearOfStudy: '2', roomNumber: '103', email: 'BOB@example.com' }, // Duplicate email/username
      ];

      const result = await importService.validateData(testRows);

      expect(result.totalRows).toBe(3);
      expect(result.validRowsCount).toBe(1); // Only row 2 is valid
      expect(result.invalidRowsCount).toBe(2);
      expect(result.rowErrors).toHaveLength(2);
      expect(result.rowErrors[0].errors).toContain('Duplicate Email');
      expect(result.rowErrors[1].errors).toContain('Duplicate Email');
    });

    it('should detect database duplicates', async () => {
      mockUserModel.find.mockResolvedValue([
        { email: 'existing@example.com' },
      ]);

      const testRows = [
        { rowNumber: 2, name: 'Alice', yearOfStudy: '3', roomNumber: '101', email: 'existing@example.com' }, // Duplicate email & username
        { rowNumber: 3, name: 'Bob', yearOfStudy: '2', roomNumber: '102', email: 'existing@gmail.com' }, // Duplicate username 'existing'
        { rowNumber: 4, name: 'Charlie', yearOfStudy: '1', roomNumber: '103', email: 'charlie@example.com' }, // Unique
      ];

      const result = await importService.validateData(testRows);

      expect(result.validRowsCount).toBe(1); // Only row 4 is valid
      expect(result.invalidRowsCount).toBe(2);
      expect(result.rowErrors[0].errors).toContain('Duplicate Email');
      expect(result.rowErrors[1].errors).toContain('Duplicate Username');
    });
  });

  describe('importUsers', () => {
    it('should import rows sequentially and include skipped validation rows in the summary', async () => {
      mockUserModel.find.mockResolvedValue([]);

      const validRows = [
        { rowNumber: 2, name: 'Alice', yearOfStudy: '3', roomNumber: '101', email: 'alice@example.com' },
        { rowNumber: 3, name: 'Bob', yearOfStudy: '2', roomNumber: '102', email: 'bob@example.com' },
      ];

      const result = await importService.importUsers(validRows, { user: { role: 'admin', name: 'Admin' } }, { skippedCount: 1 });

      expect(result.importedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.emailStats.sent).toBe(2);
      expect(result.rowResults).toHaveLength(2);
      expect(result.rowResults[0]).toMatchObject({ rowNumber: 2, status: 'imported', emailStatus: 'sent' });
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('should continue importing when a welcome email fails', async () => {
      mockUserModel.find.mockResolvedValue([]);
      const permanentEmailError = new Error('Mailbox unavailable');
      permanentEmailError.responseCode = 550;
      permanentEmailError.code = 'EENVELOPE';
      mockSendMail
        .mockRejectedValueOnce(permanentEmailError)
        .mockResolvedValueOnce({});

      const validRows = [
        { rowNumber: 2, name: 'Alice', yearOfStudy: '3', roomNumber: '101', email: 'alice@example.com' },
        { rowNumber: 3, name: 'Bob', yearOfStudy: '2', roomNumber: '102', email: 'bob@example.com' },
      ];

      const result = await importService.importUsers(validRows, { user: { role: 'admin', name: 'Admin' } }, { skippedCount: 0 });

      expect(result.importedCount).toBe(2);
      expect(result.emailStats.sent).toBe(1);
      expect(result.emailStats.failed).toBe(1);
      expect(result.rowResults[0]).toMatchObject({ rowNumber: 2, status: 'imported', emailStatus: 'failed' });
      expect(result.rowResults[1]).toMatchObject({ rowNumber: 3, status: 'imported', emailStatus: 'sent' });
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });
  });
});
