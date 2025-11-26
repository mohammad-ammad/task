import { Router } from 'express';
import { HealthService } from './app.service';

const router = Router();
const service = new HealthService();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     tags: [App]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 environment:
 *                   type: string
 *                   example: local
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-11-24T10:00:00.000Z
 */
router.get('/', service.getHealth.bind(service));

export default router;