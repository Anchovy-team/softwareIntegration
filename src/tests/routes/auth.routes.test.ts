import request from 'supertest';
import express from 'express';
import session from 'express-session';
import authRouter from '../../routes/auth.routes';

jest.mock('../../controllers/auth.controller', () => ({
  signup: jest.fn((req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'missing information' });
    }
    return res.status(200).json({ id: 1 });
  }),
  signin: jest.fn((req, res) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'missing information' });
    }
    if (req.body.email === 'fail@mail.com') {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    req.session.user = { email: req.body.email };
    return res.status(200).json({ message: 'login success' });
  }),
  getUser: jest.fn((req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'not authenticated' });
    }
    return res.status(200).json({ user: req.session.user });
  }),
  logout: jest.fn((req, res) => {
    req.session.destroy(() => {});
    return res.status(200).json({ message: 'logout success' });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/auth', authRouter);

describe('Auth routes integration', () => {
  describe('POST /auth/signup', () => {
    it('should return 400 if missing info', async () => {
      const res = await request(app).post('/auth/signup').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing information' });
    });

    it('should return 200 on success', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ username: 'u', email: 'e@mail.com', password: 'p' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 1 });
    });
  });

  describe('POST /auth/login', () => {
    it('should return 400 if missing info', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing information' });
    });

    it('should return 401 if invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'fail@mail.com', password: 'p' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'invalid credentials' });
    });

    it('should return 200 and set session on success', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'good@mail.com', password: 'p' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'login success' });
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'not authenticated' });
    });

    it('should return 200 and user if authenticated', async () => {
      const agent = request.agent(app);
      await agent
        .post('/auth/login')
        .send({ email: 'good@mail.com', password: 'p' });
      const res = await agent.get('/auth/me');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: { email: 'good@mail.com' } });
    });
  });

  describe('GET /auth/logout', () => {
    it('should return 200 and destroy session', async () => {
      const agent = request.agent(app);
      await agent
        .post('/auth/login')
        .send({ email: 'good@mail.com', password: 'p' });
      const res = await agent.get('/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'logout success' });
    });
  });
});
