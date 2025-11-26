import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiResponse } from '../utils';

export const validate = (schema: z.ZodType<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }));
                return ApiResponse.badRequest(res, 'Validation failed', errors);
            }
            next(error);
        }
    };
};

export const zodValidate = (schema: z.ZodType<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            
            // Update request with parsed values
            if (result.body) req.body = result.body;
            if (result.params) req.params = result.params;
            if (result.query) req.query = result.query;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(err => ({
                    path: err.path.join('.'),
                    message: err.message
                }));
                return ApiResponse.badRequest(res, 'Validation failed', errors);
            }
            next(error);
        }
    };
};