import movieServices from '../controllers/movies.controller';
import { Router } from 'express';

const router = Router();

router.get('/', movieServices.getMovies);
router.get('/top', movieServices.getTopRatedMovies);
router.get('/me', movieServices.getSeenMovies);

export default router;
