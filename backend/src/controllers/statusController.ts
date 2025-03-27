import {Request, Response} from 'express';

/**
 * Get API status
 * @route GET /api/status
 * @access Public
 */
export const getStatus = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};
