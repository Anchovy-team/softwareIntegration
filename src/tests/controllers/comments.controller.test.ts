import commentsController from '../../controllers/comments.controller';
import commentModel from '../../models/commentModel';
import { logger } from '../../middleware/winston';
import * as statusCodes from '../../constants/statusCodes';
import { Request, Response } from 'express';

jest.mock('../../models/commentModel');
jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn() },
}));

describe('comments.controller', () => {
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

  describe('addComment', () => {
    it('should return 400 if missing parameters', async () => {
      req = { params: {}, body: {} };
      await commentsController.addComment(req as Request, res);
      expect(status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should save comment and return 200', async () => {
      req = {
        params: { movie_id: '1' },
        body: { rating: 5, username: 'user', comment: 'text', title: 'title' },
      };
      (commentModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({}),
      }));

      await commentsController.addComment(req as Request, res);

      expect(status).toHaveBeenCalledWith(statusCodes.success);
      expect(json).toHaveBeenCalledWith({ message: 'Comment added' });
    });

    it('should handle save error', async () => {
      req = {
        params: { movie_id: '1' },
        body: { rating: 5, username: 'user', comment: 'text', title: 'title' },
      };
      (commentModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('fail')),
      }));

      await commentsController.addComment(req as Request, res);

      expect(status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding comment',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCommentsById', () => {
    it('should return 400 if movie_id missing or invalid', async () => {
      req = { params: { movie_id: undefined } };
      await commentsController.getCommentsById(req as Request, res);
      expect(status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(json).toHaveBeenCalledWith({ message: 'movie id missing' });

      req = { params: { movie_id: 'abc' } };
      await commentsController.getCommentsById(req as Request, res);
      expect(status).toHaveBeenCalledWith(statusCodes.badRequest);
      expect(json).toHaveBeenCalledWith({ message: 'movie id missing' });
    });

    it('should return comments and 200 on success', async () => {
      req = { params: { movie_id: '2' } };
      (commentModel.find as jest.Mock).mockResolvedValue([{ comment: 'ok' }]);

      await commentsController.getCommentsById(req as Request, res);

      expect(status).toHaveBeenCalledWith(statusCodes.success);
      expect(json).toHaveBeenCalledWith({ comments: [{ comment: 'ok' }] });
    });

    it('should handle find error', async () => {
      req = { params: { movie_id: '2' } };
      (commentModel.find as jest.Mock).mockRejectedValue(new Error('fail'));

      await commentsController.getCommentsById(req as Request, res);

      expect(status).toHaveBeenCalledWith(statusCodes.queryError);
      expect(json).toHaveBeenCalledWith({
        error: 'Exception occurred while fetching comments',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
