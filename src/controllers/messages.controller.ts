import { Request, Response } from 'express';
import messageModel from '../models/messageModel';
import logger from 'src/middleware/winston';

const getMessages = async (res: Response): Promise<Response> => {
  const messages = await messageModel.find({});
  return res.status(200).json(messages);
};

const getMessageById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { messageId } = req.params;

  try {
    const message = await messageModel.findById(messageId);
    return res.status(200).json(message);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error while getting message from DB', error.message);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    return res.status(500).json({ error: 'Error while getting message' });
  }
};

const addMessage = async (req: Request, res: Response): Promise<Response> => {
  const { message } = req.body;

  if (!message || !message.name) {
    return res.status(400).json({ error: 'missing information' });
  }

  if (!req.session?.user) {
    return res.status(500).json({ error: 'You are not authenticated' });
  }

  message.user = req.session.user._id;

  try {
    const messageObj = new messageModel(message);
    await messageObj.save();
    return res.status(200).json(messageObj);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error while adding message to DB', error.message);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    return res.status(500).json({ error: 'Failed to add message' });
  }
};

const editMessage = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.body;
  const { messageId } = req.params;

  if (!name || !messageId) {
    return res.status(400).json({ error: 'missing information' });
  }

  try {
    const message = await messageModel.findByIdAndUpdate(
      messageId,
      { name },
      { new: true },
    );
    return res.status(200).json(message);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error while updating message', error.message);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    return res.status(500).json({ error: 'Failed to update message' });
  }
};

const deleteMessage = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({ error: 'missing information' });
  }

  try {
    await messageModel.findByIdAndDelete(messageId);
    return res.status(200).json({ message: 'Message deleted' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error while deleting message', error.message);
    } else {
      logger.error('Unknown error: ' + String(error));
    }
    return res.status(500).json({ error: 'Failed to delete message' });
  }
};

export { getMessages, getMessageById, addMessage, editMessage, deleteMessage };
