import { Request, Response } from 'express';
import messageModel from '../models/messageModel';
import { logger } from '../middleware/winston';

const getMessages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const messages = await messageModel.find({});
    res.status(200).json(messages);
  } catch (error) {
    logger.error('Error while fetching messages', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const getMessageById = async (req: Request, res: Response): Promise<void> => {
  const { messageId } = req.params;

  try {
    const message = await messageModel.findById(messageId);
    res.status(200).json(message);
  } catch (error) {
    logger.error('Error while getting message from DB', error);
    res.status(500).json({ error: 'Error while getting message' });
  }
};

const addMessage = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;

  if (!message || !message.name) {
    res.status(400).json({ error: 'Missing information' });
    return;
  }

  if (!req.session?.user) {
    res.status(500).json({ error: 'You are not authenticated' });
    return;
  }

  message.user = req.session.user._id;

  try {
    const messageObj = new messageModel(message);
    await messageObj.save();
    res.status(200).json(messageObj);
  } catch (error) {
    logger.error('Error while adding message to DB', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

const editMessage = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  const { messageId } = req.params;

  if (!name || !messageId) {
    res.status(400).json({ error: 'Missing information' });
    return;
  }

  try {
    const message = await messageModel.findByIdAndUpdate(
      messageId,
      { name },
      { new: true },
    );
    res.status(200).json(message);
  } catch (error) {
    logger.error('Error while updating message', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
};

const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  const { messageId } = req.params;

  if (!messageId) {
    res.status(400).json({ error: 'Missing information' });
    return;
  }

  try {
    await messageModel.findByIdAndDelete(messageId);
    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    logger.error('Error while deleting message', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

export default {
  getMessages,
  getMessageById,
  addMessage,
  editMessage,
  deleteMessage,
};
