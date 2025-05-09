import profileServices from '../controllers/profile.controller';
import { Router } from 'express';

const router = Router();

router.put('/', profileServices.editPassword);
router.post('/', profileServices.logout);

export default router;
