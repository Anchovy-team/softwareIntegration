import { Request, Response } from 'express';
import { logger } from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';
import pool from '../boot/database/db_connect';

interface Movie {
  movie_id: number;
  title: string;
  type: string;
  release_date: string;
  rating: number;
  [key: string]: string | number;
}

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

const getMovies = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;

  if (category) {
    const result = await getMoviesByCategory(category as string);
    res.status(statusCodes.success).json({ movies: result });
  } else {
    try {
      const movies = await pool.query(
        'SELECT * FROM movies GROUP BY type, movie_id;',
      );

      const groupedMovies = movies.rows.reduce(
        (acc: Record<string, Movie[]>, movie: Movie) => {
          const { type } = movie;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(movie);
          return acc;
        },
        {},
      );

      res.status(statusCodes.success).json({ movies: groupedMovies });
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.stack);
      } else {
        logger.error('Unknown error: ' + String(error));
      }
      res
        .status(statusCodes.queryError)
        .json({ error: 'Exception occurred while fetching movies' });
    }
  }
};

const getMoviesByCategory = async (category: string): Promise<Movie[]> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
      [category],
    );
    return movies.rows;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error.stack);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    return [];
  }
};

const getTopRatedMovies = async (res: Response): Promise<void> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;',
    );
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error.stack);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while fetching top-rated movies' });
  }
};

const getSeenMovies = async (
  req: RequestWithUser,
  res: Response,
): Promise<void> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
      [req.user.email],
    );
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(error.stack);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while fetching seen movies' });
  }
};

export default { getMovies, getTopRatedMovies, getSeenMovies };
