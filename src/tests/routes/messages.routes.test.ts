import request from 'supertest';
import express from 'express';
import session from 'express-session';
import messagesRouter from '../../routes/messages.routes';

jest.mock('../../controllers/messages.controller', () => ({
  addMessage: jest.fn((req, res) => {
    const { message } = req.body;
    if (!message || !message.name) {
      return res.status(400).json({ error: 'Missing information' });
    }
    if (!req.session?.user) {
      return res.status(500).json({ error: 'You are not authenticated' });
    }
    if (message.name === 'fail') {
      return res.status(500).json({ error: 'Failed to add message' });
    }
    return res
      .status(200)
      .json({ name: message.name, user: req.session.user._id });
  }),
  getMessages: jest.fn((_req, res) => {
    return res.status(200).json([{ name: 'msg' }]);
  }),
  editMessage: jest.fn((req, res) => {
    const { name } = req.body;
    const { messageId } = req.params;
    if (!name || !messageId) {
      return res.status(400).json({ error: 'Missing information' });
    }
    if (name === 'fail') {
      return res.status(500).json({ error: 'Failed to update message' });
    }
    return res.status(200).json({ name });
  }),
  deleteMessage: jest.fn((req, res) => {
    const { messageId } = req.params;
    if (!messageId) {
      return res.status(400).json({ error: 'Missing information' });
    }
    if (messageId === 'fail') {
      return res.status(500).json({ error: 'Failed to delete message' });
    }
    return res.status(200).json({ message: 'Message deleted' });
  }),
  getMessageById: jest.fn((req, res) => {
    const { messageId } = req.params;
    if (!messageId) {
      return res.status(400).json({ error: 'Missing information' });
    }
    if (messageId === 'fail') {
      return res.status(500).json({ error: 'Error while getting message' });
    }
    return res.status(200).json({ name: 'msg', id: messageId });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/messages', (req, _res, next) => {
  if (req.method === 'POST' && req.path === '/add/message') {
    req.session.user = { _id: 'user1' };
  }
  next();
});
app.use('/messages', messagesRouter);

describe('Messages routes integration', () => {
  describe('POST /messages/add/message', () => {
    it('should return 400 if missing message or name', async () => {
      const res = await request(app).post('/messages/add/message').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Missing information' });
    });

    it('should return 500 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use(
        session({ secret: 'test', resave: false, saveUninitialized: false }),
      );
      appNoAuth.use('/messages', messagesRouter);
      const res = await request(appNoAuth)
        .post('/messages/add/message')
        .send({ message: { name: 'msg' } });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'You are not authenticated' });
    });

    it('should return 500 if add fails', async () => {
      const res = await request(app)
        .post('/messages/add/message')
        .send({ message: { name: 'fail' } });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to add message' });
    });

    it('should return 200 if message added', async () => {
      const res = await request(app)
        .post('/messages/add/message')
        .send({ message: { name: 'msg' } });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'msg', user: 'user1' });
    });
  });

  describe('GET /messages', () => {
    it('should return 200 and messages', async () => {
      const res = await request(app).get('/messages');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ name: 'msg' }]);
    });

    it('should return 200 and messages for GET /messages/', async () => {
      const res = await request(app).get('/messages/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ name: 'msg' }]);
    });
  });

  describe('PUT /messages/edit/:messageId', () => {
    it('should return 404 if missing messageId', async () => {
      const res = await request(app).put('/messages/edit/').send({});
      expect(res.status).toBe(404);
    });

    it('should return 400 if missing name', async () => {
      const res = await request(app).put('/messages/edit/123').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Missing information' });
    });

    it('should return 500 if update fails', async () => {
      const res = await request(app)
        .put('/messages/edit/123')
        .send({ name: 'fail' });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to update message' });
    });

    it('should return 200 if message updated', async () => {
      const res = await request(app)
        .put('/messages/edit/123')
        .send({ name: 'newname' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'newname' });
    });
  });

  describe('DELETE /messages/delete/:messageId', () => {
    it('should return 404 if missing messageId', async () => {
      const res = await request(app).delete('/messages/delete/');
      expect(res.status).toBe(404);
    });

    it('should return 500 if delete fails', async () => {
      const res = await request(app).delete('/messages/delete/fail');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to delete message' });
    });

    it('should return 200 if message deleted', async () => {
      const res = await request(app).delete('/messages/delete/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Message deleted' });
    });
  });

  describe('GET /messages/:messageId', () => {
    it('should return 500 if get fails', async () => {
      const res = await request(app).get('/messages/fail');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Error while getting message' });
    });

    it('should return 200 if message found', async () => {
      const res = await request(app).get('/messages/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ name: 'msg', id: '123' });
    });
  });
});
