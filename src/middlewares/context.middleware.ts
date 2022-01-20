import type { Request } from 'express';
import { Context } from '../context';
import { env } from '../config/env';
import { Injectable, NestMiddleware } from '@nestjs/common';

export interface IRequest extends Request {
  context: Context;
  query: { [key: string]: undefined | string };
}

/**
 * Returns a middleware which creates a context.
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req, res, next) {
    req.context = new Context(env);
    next();
  }
}
