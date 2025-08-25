import type { IUser } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};