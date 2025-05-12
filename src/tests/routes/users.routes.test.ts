import request from 'supertest';
import express from 'express';
import session from 'express-session';
import usersRouter from '../../routes/users.routes';

jest.mock('../../controllers/users.controller', () => ({
  register: jest.fn((req, res) => {
    const { email, username, password, country } = req.body;
    if (!email || !username || !password || !country) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if (email === 'exists@mail.com') {
      return res.status(409).json({ message: 'User already has an account' });
    }
    if (email === 'fail@mail.com') {
      return res
        .status(500)
        .json({ message: 'Exception occurred while registering' });
    }
    return res.status(200).json({ message: 'User created' });
  }),
  login: jest.fn((req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if (email === 'fail@mail.com') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while logging in' });
    }
    if (email === 'notfound@mail.com') {
      return res.status(404).json({ message: 'Incorrect email/password' });
    }
    req.session.user = { email };
    return res.status(200).json({ token: 'mocked-token', username: 'user' });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/users', usersRouter);

describe('Users routes integration', () => {
  describe('POST /users/register', () => {
    it('should return 400 if missing parameters', async () => {
      const res = await request(app).post('/users/register').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 409 if user already exists', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'exists@mail.com',
        username: 'user',
        password: 'pass',
        country: 'RU',
      });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ message: 'User already has an account' });
    });

    it('should return 500 if registration fails', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'fail@mail.com',
        username: 'user',
        password: 'pass',
        country: 'RU',
      });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: 'Exception occurred while registering',
      });
    });

    it('should return 200 if user created', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'new@mail.com',
        username: 'user',
        password: 'pass',
        country: 'RU',
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'User created' });
    });
  });

  describe('POST /users/login', () => {
    it('should return 400 if missing parameters', async () => {
      const res = await request(app).post('/users/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 500 if login fails', async () => {
      const res = await request(app).post('/users/login').send({
        email: 'fail@mail.com',
        password: 'pass',
      });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while logging in',
      });
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app).post('/users/login').send({
        email: 'notfound@mail.com',
        password: 'pass',
      });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Incorrect email/password' });
    });

    it('should return 200 and token if login successful', async () => {
      const res = await request(app).post('/users/login').send({
        email: 'good@mail.com',
        password: 'pass',
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ token: 'mocked-token', username: 'user' });
    });
  });
});
