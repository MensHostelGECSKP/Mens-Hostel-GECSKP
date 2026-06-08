const request = require('supertest');
const express = require('express');
const notificationRouter = require('./notification');
const notificationService = require('../services/notificationService');
const pushService = require('../services/pushService');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = { userId: 'mock-user-id', role: 'student' };
    next();
  },
  adminOnly: (req, res, next) => next(),
}));

// Mock the validators
jest.mock('../validators/notificationValidator', () => ({
  validateCreateNotification: (req, res, next) => {
    req.validated = req.body;
    next();
  },
}));

// Mock the services
jest.mock('../services/notificationService');
jest.mock('../services/pushService');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRouter);

describe('Notifications API Phase 9', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/vapid-public-key', () => {
    it('should return VAPID public key', async () => {
      pushService.getVapidPublicKey.mockReturnValue('mock-vapid-key');

      const response = await request(app).get('/api/notifications/vapid-public-key');

      expect(response.status).toBe(200);
      expect(response.body.publicKey).toBe('mock-vapid-key');
      expect(pushService.getVapidPublicKey).toHaveBeenCalled();
    });
  });

  describe('POST /api/notifications/subscribe', () => {
    it('should subscribe user successfully', async () => {
      const subData = { endpoint: 'https://example.com/endpoint', keys: { p256dh: 'dh', auth: 'auth' } };
      pushService.subscribeUser.mockResolvedValue({ _id: 'sub-id' });

      const response = await request(app)
        .post('/api/notifications/subscribe')
        .send(subData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Subscribed');
      expect(pushService.subscribeUser).toHaveBeenCalledWith('mock-user-id', subData);
    });
  });

  describe('POST /api/notifications/unsubscribe', () => {
    it('should unsubscribe user successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/unsubscribe')
        .send({ endpoint: 'https://example.com/endpoint' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Unsubscribed');
      expect(pushService.unsubscribeUser).toHaveBeenCalledWith('mock-user-id', 'https://example.com/endpoint');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app).put('/api/notifications/notif-123/read');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('marked as read');
      expect(notificationService.markAsRead).toHaveBeenCalledWith('mock-user-id', 'notif-123');
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app).post('/api/notifications/read-all');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('All notifications marked as read');
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('mock-user-id');
    });
  });

  describe('POST /api/notifications/metrics/:metricId/click', () => {
    it('should log click metric successfully', async () => {
      pushService.logClick.mockResolvedValue(true);

      const response = await request(app).post('/api/notifications/metrics/metric-456/click');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Click tracked successfully');
      expect(pushService.logClick).toHaveBeenCalledWith('metric-456');
    });

    it('should return 404 if metric not found', async () => {
      pushService.logClick.mockResolvedValue(false);

      const response = await request(app).post('/api/notifications/metrics/metric-999/click');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should dismiss notification locally for a student', async () => {
      const response = await request(app).delete('/api/notifications/notif-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('dismissed');
      expect(notificationService.deleteNotificationLocally).toHaveBeenCalledWith('mock-user-id', 'notif-123');
      expect(notificationService.deleteNotification).not.toHaveBeenCalled();
    });
  });
});
