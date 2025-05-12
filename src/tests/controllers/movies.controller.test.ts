import moviesController from '../../controllers/movies.controller';
import { logger } from '../../middleware/winston';
import pool from '../../boot/database/db_connect';
import { Request, Response } from 'express';

jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn() },
}));
jest.mock('../../constants/statusCodes', () => ({
  success: 200,
  queryError: 500,
}));
jest.mock('../../boot/database/db_connect', () => ({
  query: jest.fn(),
}));

describe('movies.controller', () => {
  let req: Partial<Request>;
  let res: Response;
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    status = jest.fn().mockReturnThis();
    json = jest.fn();
    res = { status, json } as unknown as Response;
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should return movies by category if category is present', async () => {
      req = { query: { category: 'comedy' } };
      const movies = [{ movie_id: 1, type: 'comedy' }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: movies });

      await moviesController.getMovies(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ movies });
    });

    it('should return grouped movies if no category', async () => {
      req = { query: {} };
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          { movie_id: 1, type: 'comedy' },
          { movie_id: 2, type: 'action' },
          { movie_id: 3, type: 'comedy' },
        ],
      });

      await moviesController.getMovies(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        movies: {
          comedy: [
            { movie_id: 1, type: 'comedy' },
            { movie_id: 3, type: 'comedy' },
          ],
          action: [{ movie_id: 2, type: 'action' }],
        },
      });
    });

    it('should handle error when fetching movies', async () => {
      req = { query: {} };
      (pool.query as jest.Mock).mockRejectedValue(new Error('fail'));

      await moviesController.getMovies(req as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while fetching movies',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getTopRatedMovies', () => {
    it('should return top rated movies', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ movie_id: 1, rating: 10 }],
      });

      await moviesController.getTopRatedMovies(res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        movies: [{ movie_id: 1, rating: 10 }],
      });
    });

    it('should handle error when fetching top rated movies', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('fail'));

      await moviesController.getTopRatedMovies(res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while fetching top-rated movies',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSeenMovies', () => {
    it('should return seen movies', async () => {
      req = { user: { email: 'test@mail.com' } } as unknown as Request;
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ movie_id: 1, title: 'Test' }],
      });

      await moviesController.getSeenMovies(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        movies: [{ movie_id: 1, title: 'Test' }],
      });
    });

    it('should handle error when fetching seen movies', async () => {
      req = { user: { email: 'test@mail.com' } } as unknown as Request;
      (pool.query as jest.Mock).mockRejectedValue(new Error('fail'));

      await moviesController.getSeenMovies(req as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while fetching seen movies',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
