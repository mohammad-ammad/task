import { Response } from 'express';

export class ApiResponse {
    static success<T>(
        res: Response,
        data: T,
        message: string = 'Success',
        statusCode: number = 200
    ): void {
        res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    static error(
        res: Response,
        message: string = 'An error occurred',
        statusCode: number = 500,
        errors?: any
    ): void {
        res.status(statusCode).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        });
    }

    static created<T>(
        res: Response,
        data: T,
        message: string = 'Resource created successfully'
    ): void {
        this.success(res, data, message, 201);
    }

    static badRequest(
        res: Response,
        message: string = 'Bad request',
        errors?: any
    ): void {
        this.error(res, message, 400, errors);
    }

    static unauthorized(
        res: Response,
        message: string = 'Unauthorized'
    ): void {
        this.error(res, message, 401);
    }

    static forbidden(
        res: Response,
        message: string = 'Forbidden'
    ): void {
        this.error(res, message, 403);
    }

    static notFound(
        res: Response,
        message: string = 'Resource not found'
    ): void {
        this.error(res, message, 404);
    }
}