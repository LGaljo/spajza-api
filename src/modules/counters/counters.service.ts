import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counters, CountersDocument } from './counter.schema';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counters.name)
    private countersModel: Model<CountersDocument>,
  ) {}

  async getLatestCode(key: string) {
    const value = await this.countersModel
      .findOneAndUpdate({ key }, { $inc: { value: 1 } }, { upsert: true, returnOriginal: false })
      .exec();
    return value.value;
  }
}
