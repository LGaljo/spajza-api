import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RequestLog, RequestLogDocument } from '../modules/request-log/request-log.schema';
import { Model } from 'mongoose';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  constructor(@InjectModel(RequestLog.name) private requestLogModel: Model<RequestLogDocument>) {}

  async use(req: any, res: any, next: () => void) {
    await this.createLog({
      timestamp: new Date(),
      username: req?.user?.username,
      url: req?.originalUrl,
      method: req?.method,
      body: JSON.stringify(mapBody(req.body)),
      origin: req?.headers?.origin,
    });
    next();
  }

  async createLog(data: any) {
    const log = new this.requestLogModel(data);
    await log.save();
  }
}

/**
 * Returns a mapped body object without password field included.
 * @param obj Multer files object from req.
 */
function mapBody(obj): unknown {
  const body = {};
  if (obj) {
    const excludes = ['password'];
    Object.keys(obj).filter((key) => {
      if (excludes.indexOf(key) === -1) {
        body[key] = obj[key];
      }
    });
  }
  return body;
}
