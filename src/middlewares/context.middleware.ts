import type { Request } from 'express';
import { Context } from '../context';
import { env } from '../config/env';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { UserDocument } from '../modules/user/schemas/user.schema';
import { UserService } from '../modules/user/user.service';
import { JwtService } from '@nestjs/jwt';

export interface IRequest extends Request {
  context: Context;
  user: UserDocument;
  query: { [key: string]: undefined | string };
}

/**
 * Returns a middleware which creates a context.
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req, res, next) {
    if (req?.headers?.authorization) {
      const payload: any = this.jwtService.verify(req?.headers?.authorization.split(' ')[1]);
      req.user = await this.usersService.findOneById(payload?.userId);
    }

    req.context = new Context(env);
    next();
  }
}
