import { Request, Response } from 'express';
import notFoundMiddleware from '../../middleware/notFound';

describe('notFoundMiddleware', () => {
  it('should respond with 404 and error message', () => {
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    notFoundMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Not Found' },
    });
  });

  it('should handle error if res.json throws', () => {
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(() => {
        throw new Error('Mock error');
      }),
    } as unknown as Response;

    expect(() => notFoundMiddleware(req, res)).toThrow('Mock error');
  });
});
