import type { Response } from 'express';

interface SuccessEnvelope<T> {
  success: true;
  statusCode: number;
  timestamp: string;
  data: T;
}

/** Sends a payload wrapped in the standard success envelope. */
export const sendSuccess = <T>(res: Response, data: T, status = 200): Response => {
  const body: SuccessEnvelope<T> = {
    success: true,
    statusCode: status,
    timestamp: new Date().toISOString(),
    data,
  };
  return res.status(status).json(body);
};
