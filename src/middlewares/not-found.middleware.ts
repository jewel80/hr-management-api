import type { Request, Response } from 'express';

/** Renders a 404 for unmatched routes in the standard error envelope. */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
};
