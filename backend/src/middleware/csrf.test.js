jest.mock('../config', () => ({ jwtSecret: 'test-secret-32-chars-key-12345678' }));

const { generateCsrfToken, verifyCsrfToken, csrfProtection } = require('./csrf');

describe('CSRF HMAC tokens', () => {
  test('generateCsrfToken returns timestamp.hmac format', () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe('string');
    expect(token).toMatch(/^\d+\.[a-f0-9]{64}$/);
  });

  test('verifyCsrfToken accepts a fresh valid token', () => {
    const token = generateCsrfToken();
    expect(verifyCsrfToken(token)).toBe(true);
  });

  test('verifyCsrfToken rejects tampered token', () => {
    const token = generateCsrfToken();
    const tampered = token.slice(0, -4) + '0000';
    expect(verifyCsrfToken(tampered)).toBe(false);
  });

  test('verifyCsrfToken rejects expired token (>24h)', () => {
    const oldTs = Date.now() - (25 * 60 * 60 * 1000);
    const crypto = require('crypto');
    const hmac = crypto
      .createHmac('sha256', 'test-secret-32-chars-key-12345678')
      .update(String(oldTs))
      .digest('hex');
    const oldToken = `${oldTs}.${hmac}`;
    expect(verifyCsrfToken(oldToken)).toBe(false);
  });

  test('verifyCsrfToken rejects invalid or missing tokens', () => {
    expect(verifyCsrfToken(undefined)).toBe(false);
    expect(verifyCsrfToken(null)).toBe(false);
    expect(verifyCsrfToken('')).toBe(false);
    expect(verifyCsrfToken('invalid.token')).toBe(false);
    expect(verifyCsrfToken('12345')).toBe(false);
  });

  test('csrfProtection allows valid HMAC token in X-CSRF-Token header without cookies', () => {
    const token = generateCsrfToken();
    const req = {
      method: 'POST',
      headers: { 'x-csrf-token': token },
      cookies: {},
    };
    let calledNext = false;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = () => { calledNext = true; };

    csrfProtection(req, res, next);
    expect(calledNext).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('csrfProtection blocks invalid token without cookie', () => {
    const req = {
      method: 'POST',
      headers: { 'x-csrf-token': 'invalid-token' },
      cookies: {},
    };
    let calledNext = false;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = () => { calledNext = true; };

    csrfProtection(req, res, next);
    expect(calledNext).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('csrfProtection skips safe methods (GET, HEAD, OPTIONS)', () => {
    ['GET', 'HEAD', 'OPTIONS'].forEach((method) => {
      const req = { method, headers: {}, cookies: {} };
      let calledNext = false;
      const res = {};
      csrfProtection(req, res, () => { calledNext = true; });
      expect(calledNext).toBe(true);
    });
  });
});

