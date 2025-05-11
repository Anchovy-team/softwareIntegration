import jwt from 'jsonwebtoken';
import verifyToken from '../middleware/authentication';
import { unauthorized } from '../constants/statusCodes';
import type { Request, Response } from 'express';

jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

interface MockUser {
  username: string;
  email: string;
  password: string;
  messages: string[];
}

interface MockRequest extends Partial<Request> {
  header: jest.Mock;
  user?: MockUser;
}

describe('verifyToken middleware', () => {
  let req: MockRequest;
  let res: Response;
  let next: jest.Mock;

  const getMockRes = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const getMockReq = (): MockRequest => ({
    header: jest.fn(),
  });

  beforeEach(() => {
    req = getMockReq();
    res = getMockRes();
    next = jest.fn();
    process.env.JWT_SECRET_KEY = 'test_secret';
  });

  it('should call next and set req.user on valid token', () => {
    req.header.mockReturnValue('Bearer validtoken');
    mockedJwt.verify.mockReturnValue({
      user: {
        username: 'test',
        email: 'test@mail.com',
        password: '123',
        messages: [],
      },
    } as unknown as void);

    verifyToken(req as Request, res, next);

    expect(req.user).toEqual({
      username: 'test',
      email: 'test@mail.com',
      password: '123',
      messages: [],
    });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if no token provided', () => {
    req.header.mockReturnValue(undefined);

    verifyToken(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(unauthorized);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.header.mockReturnValue('Bearer invalidtoken');
    mockedJwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    verifyToken(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(unauthorized);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token payload is invalid', () => {
    req.header.mockReturnValue('Bearer sometoken');
    mockedJwt.verify.mockReturnValue({ notUser: true } as unknown as void);

    verifyToken(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(unauthorized);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
