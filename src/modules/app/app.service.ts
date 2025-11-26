import { Request, Response } from 'express';
import config from '../../configs/config';

export class HealthService {
    getHealth(req: Request, res: Response): void {
        res.status(200).json({
            status: 'ok',
            environment: config.env,
            timestamp: new Date().toISOString()
        });
    }
}