import { Router } from 'express';
import { AgentController } from './agent.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router: Router = Router();

router.use(authenticate);

router.get('/status', AgentController.getStatus);
router.put('/status', AgentController.setStatus);

router.get('/chats', AgentController.getAssignedChats);
router.post('/chats/assign', AgentController.assignSelf);
router.post('/chats/send', AgentController.sendAgentMessage);

router.get('/client/:clientId', authorize('admin'), AgentController.listByClient);
router.get('/client/:clientId/available', AgentController.getAvailable);
router.get('/client/:clientId/stats', authorize('admin'), AgentController.getStats);
router.post('/assign', authorize('admin'), AgentController.assignChat);
router.post('/unassign/:userId', authorize('admin'), AgentController.unassignChat);

export const agentRoutes = router;