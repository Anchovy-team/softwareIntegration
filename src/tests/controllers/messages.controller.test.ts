import messagesController from '../../controllers/messages.controller';
import messageModel from '../../models/messageModel';
import { logger } from '../../middleware/winston';
import { Request, Response } from 'express';
import type { Session, SessionData } from 'express-session';

jest.mock('../../models/messageModel');
jest.mock('../../middleware/winston', () => ({
  logger: { error: jest.fn() },
}));

describe('messages.controller', () => {
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

  describe('getMessages', () => {
    it('should return messages and 200', async () => {
      (messageModel.find as jest.Mock).mockResolvedValue([{ name: 'msg' }]);
      await messagesController.getMessages({} as Request, res);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith([{ name: 'msg' }]);
    });

    it('should handle error', async () => {
      (messageModel.find as jest.Mock).mockRejectedValue(new Error('fail'));
      await messagesController.getMessages({} as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to fetch messages' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getMessageById', () => {
    it('should return message and 200', async () => {
      req = { params: { messageId: '1' } };
      (messageModel.findById as jest.Mock).mockResolvedValue({ name: 'msg' });
      await messagesController.getMessageById(req as Request, res);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ name: 'msg' });
    });

    it('should handle error', async () => {
      req = { params: { messageId: '1' } };
      (messageModel.findById as jest.Mock).mockRejectedValue(new Error('fail'));
      await messagesController.getMessageById(req as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({
        error: 'Error while getting message',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('addMessage', () => {
    it('should return 400 if missing message or name', async () => {
      req = { body: {} };
      await messagesController.addMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });

      req = { body: { message: {} } };
      await messagesController.addMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });
    });

    it('should return 500 if not authenticated', async () => {
      req = {
        body: { message: { name: 'msg' } },
        session: {} as unknown as Session & Partial<SessionData>,
      };
      await messagesController.addMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'You are not authenticated' });
    });

    it('should save message and return 200', async () => {
      req = {
        body: { message: { name: 'msg' } },
        session: { user: { _id: 'user1' } } as unknown as Session &
          Partial<SessionData>,
      };
      (messageModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ name: 'msg', user: 'user1' }),
      }));

      await messagesController.addMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          save: expect.any(Function),
        }),
      );
    });

    it('should handle save error', async () => {
      req = {
        body: { message: { name: 'msg' } },
        session: { user: { _id: 'user1' } } as unknown as Session &
          Partial<SessionData>,
      };
      (messageModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('fail')),
      }));

      await messagesController.addMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to add message' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('editMessage', () => {
    it('should return 400 if missing name or messageId', async () => {
      req = { body: {}, params: {} };
      await messagesController.editMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });

      req = { body: { name: 'msg' }, params: {} };
      await messagesController.editMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });

      req = { body: {}, params: { messageId: '1' } };
      await messagesController.editMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });
    });

    it('should update message and return 200', async () => {
      req = { body: { name: 'msg' }, params: { messageId: '1' } };
      (messageModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        name: 'msg',
      });

      await messagesController.editMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ name: 'msg' });
    });

    it('should handle update error', async () => {
      req = { body: { name: 'msg' }, params: { messageId: '1' } };
      (messageModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );

      await messagesController.editMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to update message' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    it('should return 400 if missing messageId', async () => {
      req = { params: {} };
      await messagesController.deleteMessage(req as Request, res);
      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({ error: 'Missing information' });
    });

    it('should delete message and return 200', async () => {
      req = { params: { messageId: '1' } };
      (messageModel.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      await messagesController.deleteMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ message: 'Message deleted' });
    });

    it('should handle delete error', async () => {
      req = { params: { messageId: '1' } };
      (messageModel.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );

      await messagesController.deleteMessage(req as Request, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith({ error: 'Failed to delete message' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
