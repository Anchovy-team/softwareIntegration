import { Router, Response } from 'express';

const router = Router();

router.get('/api/health', (res: Response) => {
  res.status(200).json({
    message: 'All up and running !!',
  });
});

export default router;
