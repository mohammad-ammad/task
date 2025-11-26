import { Router } from 'express';
import appRoutes from './app/app.controller';
import usersRoutes from './users/users.controller';
import { rateLimiter } from '../middlewares/rate-limiter.middleware';

const router = Router();

router.use('/health', appRoutes);
router.use('/users', rateLimiter.middleware(), usersRoutes);
router.use('/cache', rateLimiter.middleware(), usersRoutes);
router.use('/cache-status', rateLimiter.middleware(), usersRoutes);

export default router;