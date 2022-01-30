import { Injectable } from '@nestjs/common';
import { Trace, TraceDocument } from './schema/tracing.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { getObjectDiff } from '../../lib/utils';

@Injectable()
export class TracingService {
  constructor(@InjectModel(Trace.name) private modelTrace: Model<TraceDocument>) {}

  async saveChange(type: string, beforeObj: any, nowObj: any, userId: number) {
    const changes = getObjectDiff(beforeObj, nowObj);

    const trace = new this.modelTrace({
      type,
      changes,
      originalObjectId: new ObjectId(nowObj._id),
      user: new ObjectId(userId),
    });
    await trace.save();
  }

  async getChangesForObject(id: string) {
    return await this.modelTrace
      .aggregate([
        { $match: { originalObjectId: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userObj',
          },
        },
        { $unwind: { path: '$userObj', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            changes: { $first: '$changes' },
            originalObjectId: { $first: '$originalObjectId' },
            type: { $first: '$type' },
            user: { $first: '$userObj' },
            userId: { $first: '$user' },
            _createdAt: { $first: '$_createdAt' },
          },
        },
      ])
      .exec();
  }
}
