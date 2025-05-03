import { Router } from 'express';

const router = Router();

import profileServices from '../controllers/profile.controller';

router.put('/', profileServices.editPassword);
router.post('/', profileServices.logout);

export default router;
