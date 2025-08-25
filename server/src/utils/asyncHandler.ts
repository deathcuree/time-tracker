import { Request, Response, NextFunction, RequestHandler } from 'express';

export type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<unknown> | unknown;

export function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function wrapHandlers(...handlers: RequestHandler[]): RequestHandler[] {
  return handlers.map((h) => asyncHandler(h as unknown as AsyncRequestHandler) as RequestHandler);
}