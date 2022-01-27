import { Injectable } from '@nestjs/common';
import { Trace, TraceDocument } from './schema/tracing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getObjectDiff } from '../../lib/utils';

@Injectable()
export class TracingService {
  constructor(@InjectModel(Trace.name) private modelTrace: Model<TraceDocument>) {}

  async saveChange(type: string, action: string, beforeObj: any, nowObj: any) {
    const changes = getObjectDiff(beforeObj, nowObj);
    const trace = new this.modelTrace({ type, changes, objectId: nowObj._id, action });
    await trace.save();
  }
}
