import { Router } from 'express';

const router = Router();

import authServices from '../controllers/auth.controller';

router.post('/signup', authServices.signup);
router.post('/login', authServices.signin);
router.get('/me', authServices.getUser);
router.get('/logout', authServices.logout);

export default router;
