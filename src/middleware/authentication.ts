import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { unauthorized } from '../constants/statusCodes';
import { logger } from './winston';

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

const verifyToken = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.header('Authorization');

  if (!token) {
    res.status(unauthorized).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token.split(' ')[1],
      process.env.JWT_SECRET_KEY as string,
    );

    if (typeof decoded !== 'string' && 'user' in decoded) {
      req.user = decoded.user;
    } else {
      throw new Error('Invalid token payload');
    }

    logger.info('TOKEN USER: ', req.user);
    next();
  } catch (error) {
    logger.error(error);
    res.status(unauthorized).json({ error: 'Invalid token' });
  }
};

export default verifyToken;
