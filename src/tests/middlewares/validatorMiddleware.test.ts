import { Request, Response, NextFunction } from 'express';
import validator from '../../middleware/validator';

jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn() },
}));

describe('validator middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should remove creation_date from body and set new date', () => {
    req.body = { creation_date: '2020-01-01', foo: 'bar' };

    validator(req as Request, res as Response, next as NextFunction);

    expect(req.body?.creation_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(req.body?.foo).toBe('bar');
    expect(next).toHaveBeenCalled();
  });

  it('should set empty string fields to null', () => {
    req.body = { name: '', age: 25 };

    validator(req as Request, res as Response, next as NextFunction);

    expect(req.body?.name).toBeNull();
    expect(req.body?.age).toBe(25);
    expect(next).toHaveBeenCalled();
  });
});
