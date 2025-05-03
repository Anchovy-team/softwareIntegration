import { Router } from 'express';

const router = Router();

import messageService from '../controllers/messages.controller';

// here we define our routes
router.post('/add/message', messageService.addMessage);
router.get('/', messageService.getMessages);
router.put('/edit/:messageId', messageService.editMessage);
router.delete('/delete/:messageId', messageService.deleteMessage);
router.get('/:messageId', messageService.getMessageById);

export default router;
