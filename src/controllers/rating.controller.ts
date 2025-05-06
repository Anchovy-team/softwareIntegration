import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';
import ratingModel, { Rating } from '../models/ratingModel';

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

const addRating = async (
  req: RequestWithUser,
  res: Response,
): Promise<void> => {
  const { movieId } = req.params;
  const { rating } = req.body;

  const movie_id: number = parseInt(movieId);

  if (isNaN(movie_id) || !rating) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  } else {
    try {
      const ratingObj = new ratingModel({
        email: req.user.email,
        movie_id,
        rating,
      });

      await ratingObj.save();

      const ratings: Rating[] = await ratingModel.find({}, { rating: 1 });

      const averageRating: number =
        ratings.reduce((acc, rating) => acc + rating.rating, 0) /
        ratings.length;

      logger.info(
        `Average Rating: ${averageRating}, Type: ${typeof averageRating}`,
      );
      await pool.query('UPDATE movies SET rating = $1 WHERE movie_id = $2;', [
        averageRating,
        movie_id,
      ]);
      res.status(statusCodes.success).json({ message: 'Rating added' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.stack);
      } else {
        logger.error('Unknown error: ' + String(error));
      }
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while adding rating' });
    }
  }
};

export { addRating };
