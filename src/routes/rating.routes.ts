import { Router } from 'express';

const router = Router();

import ratingService from '../controllers/rating.controller';

router.post('/:movieId', ratingService.addRating);

export default router;
