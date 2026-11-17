const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authService = require('./authService');

jest.mock('../models/User');
jest.mock('bcryptjs');

describe('authService.changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully changes password when current password matches', async () => {
    const mockUser = {
      _id: 'user123',
      password: 'hashedCurrentPassword',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.changePassword('user123', 'OldPass123', 'NewSecretPass456');

    expect(result).toBe(true);
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(bcrypt.compare).toHaveBeenCalledWith('OldPass123', 'hashedCurrentPassword');
    expect(mockUser.password).toBe('NewSecretPass456');
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });

  test('throws INVALID_CURRENT_PASSWORD when current password does not match', async () => {
    const mockUser = {
      _id: 'user123',
      password: 'hashedCurrentPassword',
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.changePassword('user123', 'WrongOldPass', 'NewSecretPass456')
    ).rejects.toThrow('INVALID_CURRENT_PASSWORD');

    expect(mockUser.save).not.toHaveBeenCalled();
  });

  test('throws USER_NOT_FOUND when user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    await expect(
      authService.changePassword('nonexistent', 'OldPass', 'NewPass')
    ).rejects.toThrow('USER_NOT_FOUND');
  });
});
