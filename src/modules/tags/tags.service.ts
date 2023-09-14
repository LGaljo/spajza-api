import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';
import { InventoryItem, InventoryItemDocument } from '../inventoryitem/schemas/inventoryitem.schema';
import { ObjectId } from 'mongodb';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private model: Model<TagDocument>,
    @InjectModel(InventoryItem.name) private modelItem: Model<InventoryItemDocument>,
  ) {}

  async create(object: any): Promise<TagDocument> {
    const item = new this.model(object);
    await item.save();
    return item;
  }

  async findAll(): Promise<TagDocument[]> {
    return this.model.find({ _deletedAt: null }).sort({ name: 1 }).exec();
  }

  async findOneById(id: ObjectId): Promise<TagDocument> {
    return this.model.findOne({ _id: new ObjectId(id), _deletedAt: null }).exec();
  }

  async findOneByName(name: string): Promise<TagDocument> {
    return this.model.findOne({ name, _deletedAt: null }).exec();
  }

  async updateOne(body: any, id: ObjectId): Promise<any> {
    return this.model.updateOne({ _id: new ObjectId(id), _deletedAt: null }, { $set: body }).exec();
  }

  async deleteOne(id: string): Promise<any> {
    const countItems = await this.modelItem
      .find({ category: new ObjectId(id), _deletedAt: null })
      .count()
      .exec();
    if (countItems > 0) {
      throw new BadRequestException('There are still objects connected to the tag');
    }
    await this.modelItem.updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: new Date() } }).exec();
  }

  // async exists(id: string): Promise<boolean> {
  //   const obj = await this.model.findOne({ _id: new ObjectId(id), _deletedAt: null }).exec();
  //   return !!obj?._id;
  // }
}
