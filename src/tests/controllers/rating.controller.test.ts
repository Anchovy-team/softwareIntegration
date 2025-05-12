import ratingController from '../../controllers/rating.controller';
import pool from '../../boot/database/db_connect';
import { logger } from '../../middleware/winston';
import ratingModel from '../../models/ratingModel';
import { Request, Response } from 'express';

jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));
jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));
jest.mock('../../constants/statusCodes', () => ({
  badRequest: 400,
  success: 200,
  queryError: 500,
}));
jest.mock('../../models/ratingModel', () => {
  const actual = jest.requireActual('../../models/ratingModel');
  return Object.assign(jest.fn(), actual, {
    find: jest.fn(),
  });
});

describe('rating.controller', () => {
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

  describe('addRating', () => {
    it('should return 400 if missing parameters', async () => {
      req.params = {};
      req.body = {};
      await ratingController.addRating(req as unknown as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should add rating and return 200', async () => {
      req.params = { movieId: '1' };
      req.body = { rating: 5 };
      req.user = { email: 'test@mail.com' };
      (ratingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({}),
      }));
      (ratingModel.find as jest.Mock).mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
      ]);
      (pool.query as jest.Mock).mockResolvedValue({});

      await ratingController.addRating(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Rating added' });
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
        [4.5, 1],
      );
    });

    it('should handle error in try block', async () => {
      req.params = { movieId: '1' };
      req.body = { rating: 5 };
      req.user = { email: 'test@mail.com' };
      (ratingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('fail')),
      }));

      await ratingController.addRating(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding rating',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle unknown error', async () => {
      req.params = { movieId: '1' };
      req.body = { rating: 5 };
      req.user = { email: 'test@mail.com' };
      (ratingModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({}),
      }));
      (ratingModel.find as jest.Mock).mockImplementation(() => {
        throw 'some error';
      });

      await ratingController.addRating(req as unknown as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding rating',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
