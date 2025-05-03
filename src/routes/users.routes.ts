import { Router } from 'express';

const router = Router();

import userServices from '../controllers/users.controller';

router.post('/register', userServices.register);
router.post('/login', userServices.login);

export default router;
