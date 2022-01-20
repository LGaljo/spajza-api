import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private model: Model<TagDocument>) {}

  async create(object: any): Promise<TagDocument> {
    const item = new this.model(object);
    await item.save();
    return item;
  }

  async findAll(): Promise<TagDocument[]> {
    return await this.model.find().sort({ name: 1 }).exec();
  }

  async findOneById(id: ObjectId): Promise<TagDocument> {
    return await this.model.findOne({ _id: id }).exec();
  }

  async findOneByName(name: string): Promise<TagDocument> {
    return await this.model.findOne({ name }).exec();
  }

  async updateOne(body: any, id: string): Promise<any> {
    return await this.model.updateOne({ _id: id }, { $set: body }).exec();
  }

  async deleteOne(id: string): Promise<any> {
    return await this.model.deleteOne({ _id: id }).exec();
  }

  async exists(InventoryItemId: string): Promise<boolean> {
    const obj = await this.model.findOne({ InventoryItemId }).exec();
    return !!obj?._id;
  }
}
