import { Router, Request, Response } from 'express';
import { userService } from './users.service';
import { zodValidate } from '../../middlewares/zod-validate.middleware';
import { getUserByIdSchema, createUserSchema } from './users.validation';
import { ApiResponse } from '../../utils/api-response.utils';

const router = Router();

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user data by ID. Data is cached for 60 seconds.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 */
router.get(
  '/:id',
  zodValidate(getUserByIdSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const user = await userService.getUserById(userId);

      if (!user) {
        return ApiResponse.notFound(res, `User with ID ${userId} not found`);
      }

      ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      console.error('[UserController] Error getting user:', error);
      ApiResponse.error(res, 'Internal server error', 500, { code: 'INTERNAL_ERROR' });
    }
  }
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user and add to cache
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bob Wilson
 *               email:
 *                 type: string
 *                 format: email
 *                 example: bob@example.com
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/',
  zodValidate(createUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email } = req.body;
      const user = await userService.createUser({ name, email });

      ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
      console.error('[UserController] Error creating user:', error);
      ApiResponse.error(res, 'Internal server error', 500, { code: 'INTERNAL_ERROR' });
    }
  }
);

/**
 * @swagger
 * /cache:
 *   delete:
 *     summary: Clear entire cache
 *     description: Manually clear all cached data
 *     tags: [Cache Management]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       429:
 *         description: Rate limit exceeded
 */
router.delete('/cache', async (req: Request, res: Response): Promise<void> => {
  try {
    userService.clearCache();
    ApiResponse.success(res, null, 'Cache cleared successfully');
  } catch (error) {
    console.error('[UserController] Error clearing cache:', error);
    ApiResponse.error(res, 'Internal server error', 500, { code: 'INTERNAL_ERROR' });
  }
});

/**
 * @swagger
 * /cache-status:
 *   get:
 *     summary: Get cache status
 *     description: Get current cache statistics and performance metrics
 *     tags: [Cache Management]
 *     responses:
 *       200:
 *         description: Cache status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cacheSize:
 *                       type: integer
 *                     cacheHits:
 *                       type: integer
 *                     cacheMisses:
 *                       type: integer
 *                     totalRequests:
 *                       type: integer
 *                     hitRate:
 *                       type: number
 *                     averageResponseTime:
 *                       type: number
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/cache-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = userService.getCacheStatus();
    ApiResponse.success(res, status, 'Cache status retrieved successfully');
  } catch (error) {
    console.error('[UserController] Error getting cache status:', error);
    ApiResponse.error(res, 'Internal server error', 500, { code: 'INTERNAL_ERROR' });
  }
});

export default router;
