import request from 'supertest';
import express from 'express';
import session from 'express-session';
import commentsRouter from '../../routes/comments.routes';

jest.mock('../../controllers/comments.controller', () => ({
  getCommentsById: jest.fn((req, res) => {
    const movieId = req.params.movie_id;
    if (!movieId || isNaN(Number(movieId))) {
      return res.status(400).json({ message: 'movie id missing' });
    }
    if (movieId === '404') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while fetching comments' });
    }
    return res
      .status(200)
      .json({ comments: [{ comment: 'ok', movie_id: movieId }] });
  }),
  addComment: jest.fn((req, res) => {
    const { rating, username, comment, title } = req.body;
    const movieId = req.params.movie_id;
    if (
      !movieId ||
      isNaN(Number(movieId)) ||
      !rating ||
      !username ||
      !comment ||
      !title
    ) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if (movieId === '500') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while adding comment' });
    }
    return res.status(200).json({ message: 'Comment added' });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/comments', commentsRouter);

describe('Comments routes integration', () => {
  describe('GET /comments/:movie_id', () => {
    it('should return 400 if movie_id missing or invalid', async () => {
      const res = await request(app).get('/comments/abc');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'movie id missing' });
    });

    it('should return 500 if controller throws error', async () => {
      const res = await request(app).get('/comments/404');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while fetching comments',
      });
    });

    it('should return 200 and comments on success', async () => {
      const res = await request(app).get('/comments/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        comments: [{ comment: 'ok', movie_id: '1' }],
      });
    });
  });

  describe('POST /comments/:movie_id', () => {
    it('should return 400 if missing parameters', async () => {
      const res = await request(app).post('/comments/1').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 400 if movie_id invalid', async () => {
      const res = await request(app).post('/comments/abc').send({
        rating: 5,
        username: 'user',
        comment: 'text',
        title: 'title',
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 500 if controller throws error', async () => {
      const res = await request(app).post('/comments/500').send({
        rating: 5,
        username: 'user',
        comment: 'text',
        title: 'title',
      });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while adding comment',
      });
    });

    it('should return 200 if comment added', async () => {
      const res = await request(app).post('/comments/1').send({
        rating: 5,
        username: 'user',
        comment: 'text',
        title: 'title',
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Comment added' });
    });
  });
});
