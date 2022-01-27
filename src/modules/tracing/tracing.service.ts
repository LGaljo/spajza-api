import { Injectable } from '@nestjs/common';
import { Trace, TraceDocument } from './schema/tracing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { getObjectDiff } from '../../lib/utils';

@Injectable()
export class TracingService {
  constructor(@InjectModel(Trace.name) private modelTrace: Model<TraceDocument>) {}

  async saveChange(type: string, action: string, beforeObj: any, nowObj: any) {
    const changes = getObjectDiff(beforeObj, nowObj);

    const trace = new this.modelTrace({
      type,
      changes,
      originalObjectId: new ObjectId(nowObj._id),
      action,
    });
    await trace.save();
  }

  async getChangesForObject(id: string) {
    return await this.modelTrace.find({ originalObjectId: new ObjectId(id) }).exec();
  }
}
