import request from 'supertest';
import express from 'express';
import session from 'express-session';
import moviesRouter from '../../routes/movies.routes';

jest.mock('../../controllers/movies.controller', () => ({
  getMovies: jest.fn((req, res) => {
    if (req.query.category === 'fail') {
      return res
        .status(500)
        .json({ error: 'Exception occurred while fetching movies' });
    }
    if (req.query.category) {
      return res
        .status(200)
        .json({ movies: [{ movie_id: 1, type: req.query.category }] });
    }
    return res
      .status(200)
      .json({ movies: { comedy: [{ movie_id: 1, type: 'comedy' }] } });
  }),
  getTopRatedMovies: jest.fn((req, res) => {
    if (req.query.fail) {
      return res
        .status(500)
        .json({ error: 'Exception occurred while fetching top-rated movies' });
    }
    return res.status(200).json({ movies: [{ movie_id: 1, rating: 10 }] });
  }),
  getSeenMovies: jest.fn((req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.query.fail) {
      return res
        .status(500)
        .json({ error: 'Exception occurred while fetching seen movies' });
    }
    return res.status(200).json({ movies: [{ movie_id: 1, title: 'Test' }] });
  }),
}));

const app = express();
app.use(express.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
app.use('/movies', (req, _res, next) => {
  if (req.path === '/me') {
    req.session.user = { email: 'test@mail.com' };
  }
  next();
});
app.use('/movies', moviesRouter);

describe('Movies routes integration', () => {
  describe('GET /movies', () => {
    it('should return 200 and grouped movies', async () => {
      const res = await request(app).get('/movies');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        movies: { comedy: [{ movie_id: 1, type: 'comedy' }] },
      });
    });

    it('should return 200 and movies by category', async () => {
      const res = await request(app).get('/movies?category=comedy');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ movies: [{ movie_id: 1, type: 'comedy' }] });
    });

    it('should return 500 if controller fails', async () => {
      const res = await request(app).get('/movies?category=fail');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while fetching movies',
      });
    });
  });

  describe('GET /movies/top', () => {
    it('should return 200 and top rated movies', async () => {
      const res = await request(app).get('/movies/top');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ movies: [{ movie_id: 1, rating: 10 }] });
    });

    it('should return 500 if controller fails', async () => {
      const res = await request(app).get('/movies/top?fail=1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while fetching top-rated movies',
      });
    });
  });

  describe('GET /movies/me', () => {
    it('should return 401 if not authenticated', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use(
        session({ secret: 'test', resave: false, saveUninitialized: false }),
      );
      appNoAuth.use('/movies', moviesRouter);
      const res = await request(appNoAuth).get('/movies/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Not authenticated' });
    });

    it('should return 200 and seen movies', async () => {
      const res = await request(app).get('/movies/me');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ movies: [{ movie_id: 1, title: 'Test' }] });
    });

    it('should return 500 if controller fails', async () => {
      const res = await request(app).get('/movies/me?fail=1');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: 'Exception occurred while fetching seen movies',
      });
    });
  });
});
