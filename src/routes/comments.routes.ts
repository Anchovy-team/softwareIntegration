import { Router } from 'express';

const router = Router();

import commentServices from '../controllers/comments.controller';

router.get('/:movie_id', commentServices.getCommentsById);
router.post('/:movie_id', commentServices.addComment);

export default router;
