import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import { logger } from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

export const editPassword = async (
  req: RequestWithUser,
  res: Response,
): Promise<void> => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  if (oldPassword === newPassword) {
    res
      .status(statusCodes.badRequest)
      .json({ message: 'New password cannot be equal to old password' });
    return;
  }

  try {
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [req.user.email, oldPassword],
    );

    if (userQuery.rows[0]) {
      try {
        await pool.query(
          'UPDATE users SET password = crypt($1, gen_salt("bf")) WHERE email = $2;',
          [newPassword, req.user.email],
        );
        res.status(statusCodes.success).json({ message: 'Password updated' });
      } catch (updateError) {
        logger.error(updateError.stack);
        res.status(statusCodes.queryError).json({
          error: 'Exception occurred while updating password',
        });
      }
    } else {
      res
        .status(statusCodes.badRequest)
        .json({ message: 'Incorrect password' });
    }
  } catch (queryError) {
    logger.error(queryError.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while updating password' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.session.user) {
    delete req.session.user;
  }

  res.status(200).json({ message: 'Disconnected' });
};

export default {
  editPassword,
  logout,
};
