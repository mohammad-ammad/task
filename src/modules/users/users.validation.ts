import { z } from 'zod';

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email format'),
  }),
});

export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
