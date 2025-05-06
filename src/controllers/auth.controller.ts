import { Request, Response } from 'express';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from 'src/middleware/winston';

interface RequestWithUser extends Request {
  user?: {
    username: string;
    email: string;
    password: string;
    messages: string[];
  };
}

const signup = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'missing information' });
  }

  const hash = bcrypt.hashSync(password, 10);

  try {
    const User = new userModel({
      email,
      username,
      password: hash,
    });
    const user = await User.save();
    return res.status(200).json(user);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to save user, error: ${error}` });
  }
};

const signin = async (
  req: RequestWithUser,
  res: Response,
): Promise<Response> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'missing information' });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(400)
        .json({ message: 'Email or password do not match' });
    }

    req.session.user = {
      _id: user._id.toString(),
    };

    const token = jwt.sign(
      { user: { id: user._id, email: user.email } },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: '1h',
      },
    );

    return res.status(200).json({ token });
  } catch (error) {
    logger.error('Error while getting user from DB', error.message);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

const getUser = async (req: Request, res: Response): Promise<Response> => {
  const session = req.session;

  if (!session.user) {
    return res.status(500).json({ error: 'You are not authenticated' });
  }

  try {
    const user = await userModel
      .findById(session.user._id, {
        password: 0,
      })
      .populate('messages');

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    logger.error('Error while getting user from DB', error.message);
    return res.status(500).json({ error: 'Failed to get user' });
  }
};

const logout = (req: Request, res: Response): Response => {
  const session = req.session;

  if (session.user) {
    delete session.user;
  }

  return res.status(200).json({ message: 'Disconnected' });
};

export default {
  signup,
  signin,
  getUser,
  logout,
};
