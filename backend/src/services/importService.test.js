const importService = require('./importService');
const User = require('../models/User');

jest.mock('../models/User');

describe('importService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      User.find.mockResolvedValue([]); // No existing users in DB

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
      User.find.mockResolvedValue([]);

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
      User.find.mockResolvedValue([]);

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
      User.find.mockResolvedValue([
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
});
