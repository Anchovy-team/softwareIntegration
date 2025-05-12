import usersController from '../../controllers/users.controller';
import pool from '../../boot/database/db_connect';
import { logger } from '../../middleware/winston';
import { Request, Response } from 'express';
import type { Session, SessionData } from 'express-session';

jest.mock('../../boot/database/db_connect', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));
jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));
jest.mock('../../constants/statusCodes', () => ({
  badRequest: 400,
  success: 200,
  queryError: 500,
  userAlreadyExists: 409,
  notFound: 404,
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
}));

describe('users.controller', () => {
  let req: Partial<Request> & { session?: Session & Partial<SessionData> };
  let res: Response;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    res = { status, json } as unknown as Response;
    req = { session: {} as unknown as Session & Partial<SessionData> };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if missing parameters', async () => {
      req.body = {};
      await usersController.register(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 409 if user already exists', async () => {
      req.body = { email: 'a', username: 'b', password: 'c', country: 'd' };
      const client = {
        query: jest.fn().mockResolvedValueOnce({ rowCount: 1 }),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(client);

      await usersController.register(req as unknown as Request, res);

      expect(client.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1;',
        ['a'],
      );
      expect(status).toHaveBeenCalledWith(409);
      expect(json).toHaveBeenCalledWith({
        message: 'User already has an account',
      });
      expect(client.release).toHaveBeenCalled();
    });

    it('should create user and address and return 200', async () => {
      req.body = {
        email: 'a',
        username: 'b',
        password: 'c',
        country: 'd',
        city: 'e',
        street: 'f',
        creation_date: '2024-01-01',
      };
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rowCount: 0 })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(client);

      await usersController.register(req as unknown as Request, res);

      expect(client.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1;',
        ['a'],
      );
      expect(client.query).toHaveBeenCalledWith(
        `INSERT INTO users(email, username, password, creation_date)
           VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
        ['a', 'b', 'c', '2024-01-01'],
      );
      expect(client.query).toHaveBeenCalledWith(
        'INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);',
        ['a', 'd', 'f', 'e'],
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'User created' });
      expect(client.release).toHaveBeenCalled();
    });

    it('should handle error and rollback', async () => {
      req.body = { email: 'a', username: 'b', password: 'c', country: 'd' };
      const client = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rowCount: 0 })
          .mockRejectedValueOnce(new Error('fail')),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(client);

      await usersController.register(req as unknown as Request, res);

      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        message: 'Exception occurred while registering',
      });
      expect(logger.error).toHaveBeenCalled();
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 if missing parameters', async () => {
      req.body = {};
      await usersController.login(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 500 if query error', async () => {
      req.body = { email: 'a', password: 'b' };
      (pool.query as jest.Mock).mockImplementation((_q, _p, cb) => {
        cb({ stack: 'fail' }, null);
      });

      await usersController.login(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while logging in',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      req.body = { email: 'a', password: 'b' };
      (pool.query as jest.Mock).mockImplementation((_q, _p, cb) => {
        cb(null, { rows: [] });
      });

      await usersController.login(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith({
        message: 'Incorrect email/password',
      });
    });

    it('should set session and return token and username on success', async () => {
      req.body = { email: 'a', password: 'b' };
      req.session = {} as unknown as Session & Partial<SessionData>;
      (pool.query as jest.Mock).mockImplementation((_q, _p, cb) => {
        cb(null, { rows: [{ email: 'a', username: 'b' }] });
      });

      await usersController.login(req as unknown as Request, res);

      expect(req.session.user).toEqual({ email: 'a' });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        token: 'mocked-token',
        username: 'b',
      });
    });
  });
});
