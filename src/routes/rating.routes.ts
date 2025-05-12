import ratingService from '../controllers/rating.controller';
import { Router } from 'express';

const router = Router();

router.post('/:movieId', ratingService.addRating);

export default router;
