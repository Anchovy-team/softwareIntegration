import request from 'supertest';
import express from 'express';
import session from 'express-session';
import profileRouter from '../../routes/profile.routes';

jest.mock('../../controllers/profile.controller', () => ({
  editPassword: jest.fn((req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: 'New password cannot be equal to old password' });
    }
    if (oldPassword === 'fail') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while updating password' });
    }
    if (oldPassword === 'wrong') {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    return res.status(200).json({ message: 'Password updated' });
  }),
  logout: jest.fn((req, res) => {
    if (req.session && req.session.user) {
      delete req.session.user;
    }
    return res.status(200).json({ message: 'Disconnected' });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/profile', (req, _res, next) => {
  req.session.user = { email: 'test@mail.com' };
  next();
});
app.use('/profile', profileRouter);

describe('Profile routes integration', () => {
  describe('PUT /profile', () => {
    it('should return 400 if missing parameters', async () => {
      const res = await request(app).put('/profile').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 400 if new password equals old password', async () => {
      const res = await request(app)
        .put('/profile')
        .send({ oldPassword: '123', newPassword: '123' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: 'New password cannot be equal to old password',
      });
    });

    it('should return 400 if incorrect password', async () => {
      const res = await request(app)
        .put('/profile')
        .send({ oldPassword: 'wrong', newPassword: 'new' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Incorrect password' });
    });

    it('should return 500 if update fails', async () => {
      const res = await request(app)
        .put('/profile')
        .send({ oldPassword: 'fail', newPassword: 'new' });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while updating password',
      });
    });

    it('should return 200 if password updated', async () => {
      const res = await request(app)
        .put('/profile')
        .send({ oldPassword: 'old', newPassword: 'new' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Password updated' });
    });
  });

  describe('POST /profile', () => {
    it('should return 200 and disconnect', async () => {
      const res = await request(app).post('/profile');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Disconnected' });
    });
  });
});
