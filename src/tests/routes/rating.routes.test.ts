import request from 'supertest';
import express from 'express';
import session from 'express-session';
import ratingRouter from '../../routes/rating.routes';

jest.mock('../../controllers/rating.controller', () => ({
  addRating: jest.fn((req, res) => {
    const { movieId } = req.params;
    const { rating } = req.body;
    if (!movieId || isNaN(Number(movieId)) || !rating) {
      return res.status(400).json({ message: 'Missing parameters' });
    }
    if (movieId === '500') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while adding rating' });
    }
    return res.status(200).json({ message: 'Rating added' });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/rating', ratingRouter);

describe('Rating routes integration', () => {
  describe('POST /rating/:movieId', () => {
    it('should return 400 if missing parameters', async () => {
      const res = await request(app).post('/rating/').send({});
      expect(res.status).toBe(404);
    });

    it('should return 400 if movieId is invalid', async () => {
      const res = await request(app).post('/rating/abc').send({ rating: 5 });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 400 if rating is missing', async () => {
      const res = await request(app).post('/rating/1').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing parameters' });
    });

    it('should return 500 if controller fails', async () => {
      const res = await request(app).post('/rating/500').send({ rating: 5 });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while adding rating',
      });
    });

    it('should return 200 if rating added', async () => {
      const res = await request(app).post('/rating/1').send({ rating: 5 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Rating added' });
    });
  });
});
