import authController from '../../controllers/auth.controller';
import userModel from '../../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

jest.mock('../../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

interface MockSession {
  user?: {
    _id: string;
    email?: string;
    username?: string;
  };
  [key: string]: unknown;
}

interface MockRequest {
  body?: Record<string, unknown>;
  session?: MockSession;
}

describe('auth.controller', () => {
  let req: MockRequest;
  let res: Response;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    res = { status, json } as unknown as Response;
    req = { body: {}, session: {} };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should return 400 if missing info', async () => {
      req.body = {};
      await authController.signup(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should save user and return 200', async () => {
      req.body = { username: 'u', email: 'e', password: 'p' };
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed');
      const userModelMock = userModel as unknown as jest.Mock;
      userModelMock.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
      }));

      await authController.signup(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ id: 1 });
    });

    it('should handle save error', async () => {
      req.body = { username: 'u', email: 'e', password: 'p' };
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed');
      const userModelMock = userModel as unknown as jest.Mock;
      userModelMock.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('fail')),
      }));

      await authController.signup(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        message: expect.stringContaining('failed to save user'),
      });
    });
  });

  describe('signin', () => {
    it('should return 400 if missing info', async () => {
      req.body = {};
      await authController.signin(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'missing information' });
    });

    it('should return 400 if user not found', async () => {
      req.body = { email: 'e', password: 'p' };
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      await authController.signin(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 400 if password does not match', async () => {
      req.body = { email: 'e', password: 'p' };
      (userModel.findOne as jest.Mock).mockResolvedValue({ password: 'hash' });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await authController.signin(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        message: 'Email or password do not match',
      });
    });

    it('should return 200 and token on success', async () => {
      req.body = { email: 'e', password: 'p' };
      req.session = {};
      (userModel.findOne as jest.Mock).mockResolvedValue({
        _id: 'id',
        email: 'e',
        username: 'u',
        password: 'hash',
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      await authController.signin(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ token: 'token' });
      expect(req.session?.user).toEqual({
        _id: 'id',
        email: 'e',
        username: 'u',
      });
    });

    it('should handle DB error', async () => {
      req.body = { email: 'e', password: 'p' };
      (userModel.findOne as jest.Mock).mockRejectedValue(new Error('fail'));

      await authController.signin(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to get user' });
    });
  });

  describe('getUser', () => {
    it('should return 500 if not authenticated', async () => {
      req.session = {};
      await authController.getUser(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'You are not authenticated' });
    });

    it('should return 400 if user not found', async () => {
      req.session = { user: { _id: 'id' } };
      (userModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await authController.getUser(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 200 and user on success', async () => {
      req.session = { user: { _id: 'id' } };
      const userObj = { id: 'id', username: 'u' };
      (userModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(userObj),
      });

      await authController.getUser(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(userObj);
    });

    it('should handle DB error', async () => {
      req.session = { user: { _id: 'id' } };
      (userModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('fail')),
      });

      await authController.getUser(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to get user' });
    });
  });

  describe('logout', () => {
    it('should delete session user and return 200', () => {
      req.session = { user: { _id: 'id' } };
      authController.logout(req as unknown as Request, res);
      expect(req.session?.user).toBeUndefined();
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });

    it('should return 200 even if no user in session', () => {
      req.session = {};
      authController.logout(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });
  });
});
