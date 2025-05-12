import { Request, Response } from 'express';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../middleware/winston';
import { Session, SessionData } from 'express-session';

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

const signup = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !password || !email) {
    res.status(400).json({ error: 'missing information' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const User = new userModel({
      email,
      username,
      password: hash,
    });
    const user = await User.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: `failed to save user, error: ${error}` });
  }
};

const signin = async (req: RequestWithUser, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const session = req.session as Session & Partial<SessionData>;

  if (!email || !password) {
    res.status(400).json({ error: 'missing information' });
    return;
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      res.status(400).json({ message: 'Email or password do not match' });
      return;
    }

    session.user = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
    };

    const token = jwt.sign(
      { user: { id: user._id, email: user.email } },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: '1h',
      },
    );

    res.status(200).json({ token });
  } catch (error) {
    logger.error('Error while getting user from DB', error.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const getUser = async (req: Request, res: Response): Promise<void> => {
  const session = req.session as Session & Partial<SessionData>;

  if (!session.user) {
    res.status(500).json({ error: 'You are not authenticated' });
    return;
  }

  try {
    const user = await userModel
      .findById(session.user._id, {
        password: 0,
      })
      .populate('messages');

    if (!user) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    logger.error('Error while getting user from DB', error.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const logout = (req: Request, res: Response): void => {
  const session = req.session as Session & Partial<SessionData>;

  if (session.user) {
    delete session.user;
  }

  res.status(200).json({ message: 'Disconnected' });
};

export default {
  signup,
  signin,
  getUser,
  logout,
};
