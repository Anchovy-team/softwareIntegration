import userServices from '../controllers/users.controller';
import { Router } from 'express';

const router = Router();

router.post('/register', userServices.register);
router.post('/login', userServices.login);

export default router;
