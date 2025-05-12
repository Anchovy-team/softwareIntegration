import { Request, Response } from 'express';
import { logger } from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';
import commentModel from '../models/commentModel';

const addComment = async (req: Request, res: Response): Promise<void> => {
  const { movie_id } = req.params;
  const { rating, username, comment, title } = req.body;

  const movieId = parseInt(movie_id);

  if (
    !movie_id ||
    isNaN(movieId) ||
    !rating ||
    !username ||
    !comment ||
    !title
  ) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  } else {
    try {
      const commentObj = new commentModel({
        movie_id: movieId,
        rating,
        username,
        comment,
        title,
      });

      await commentObj.save();

      res.status(statusCodes.success).json({ message: 'Comment added' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.stack);
      } else {
        logger.error('An unknown error occurred');
      }
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding comment' });
    }
  }
};

const getCommentsById = async (req: Request, res: Response): Promise<void> => {
  const { movie_id } = req.params;

  const movieId = parseInt(movie_id);

  if (!movie_id || isNaN(movieId)) {
    res.status(statusCodes.badRequest).json({ message: 'movie id missing' });
  } else {
    try {
      const comments = await commentModel.find({ movie_id: movieId });
      res.status(statusCodes.success).json({ comments });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.stack);
      } else {
        logger.error('An unknown error occurred');
      }
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while fetching comments' });
    }
  }
};

export default { addComment, getCommentsById };
