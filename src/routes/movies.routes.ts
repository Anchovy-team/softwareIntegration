import { Router } from 'express';

const router = Router();

import movieServices from '../controllers/movies.controller';

router.get('/', movieServices.getMovies);
router.get('/top', movieServices.getTopRatedMovies);
router.get('/me', movieServices.getSeenMovies);

export default router;
