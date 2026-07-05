import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 doesn't forward rejected promises from async route handlers to
 * error middleware on its own — an unhandled rejection would just hang the
 * request. Wrapping a handler in this catches that and forwards to next(),
 * so the global error handler in index.ts can return a clean 500.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
