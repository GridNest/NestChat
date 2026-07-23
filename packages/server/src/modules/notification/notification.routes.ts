import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router: Router = Router();

router.get('/', authenticate, NotificationController.list);
router.get('/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/:id/read', authenticate, NotificationController.markAsRead);
router.put('/read-all', authenticate, NotificationController.markAllAsRead);
router.delete('/:id', authenticate, NotificationController.delete);

export const notificationRoutes = router;
