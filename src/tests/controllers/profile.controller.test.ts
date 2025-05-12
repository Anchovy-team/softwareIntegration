import profileController from '../../controllers/profile.controller';
import pool from '../../boot/database/db_connect';
import { logger } from '../../middleware/winston';
import { Request, Response } from 'express';
import type { Session, SessionData } from 'express-session';

jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));
jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn() },
}));
jest.mock('../../constants/statusCodes', () => ({
  badRequest: 400,
  success: 200,
  queryError: 500,
}));

describe('profile.controller', () => {
  let req: Partial<Request> & { user?: { email?: string } };
  let res: Response;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    res = { status, json } as unknown as Response;
    req = {};
    jest.clearAllMocks();
  });

  describe('editPassword', () => {
    it('should return 400 if missing parameters', async () => {
      req.body = {};
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 400 if new password equals old password', async () => {
      req.body = { oldPassword: '123', newPassword: '123' };
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: 'New password cannot be equal to old password',
      });
    });

    it('should update password and return 200', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      req.user = { email: 'test@mail.com' };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce({});
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Password updated' });
    });

    it('should return 400 if incorrect password', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      req.user = { email: 'test@mail.com' };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'Incorrect password' });
    });

    it('should handle update error', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      req.user = { email: 'test@mail.com' };
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{}] })
        .mockRejectedValueOnce({ stack: 'fail' });
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while updating password',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle query error', async () => {
      req.body = { oldPassword: 'old', newPassword: 'new' };
      req.user = { email: 'test@mail.com' };
      (pool.query as jest.Mock).mockRejectedValueOnce({ stack: 'fail' });
      await profileController.editPassword(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while updating password',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete session user and return 200', async () => {
      req.session = { user: { _id: 'id' } } as unknown as Session &
        Partial<SessionData>;
      await profileController.logout(req as Request, res);
      expect(req.session.user).toBeUndefined();
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });

    it('should return 200 even if no user in session', async () => {
      req.session = {} as unknown as Session & Partial<SessionData>;
      await profileController.logout(req as Request, res);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });
  });
});
