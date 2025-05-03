import commentServices from '../controllers/comments.controller';
import { Router } from 'express';

const router = Router();

router.get('/:movie_id', commentServices.getCommentsById);
router.post('/:movie_id', commentServices.addComment);

export default router;
