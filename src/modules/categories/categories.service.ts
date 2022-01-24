import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { ObjectId } from 'mongodb';
import { InventoryItem, InventoryItemDocument } from '../inventoryitem/schemas/inventoryitem.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private model: Model<CategoryDocument>,
    @InjectModel(InventoryItem.name) private modelItem: Model<InventoryItemDocument>,
  ) {}

  async create(object: any): Promise<CategoryDocument> {
    const item = new this.model(object);
    await item.save();
    return item;
  }

  async findAll(): Promise<CategoryDocument[]> {
    return await this.model.find().sort({ name: 1 }).exec();
  }

  async findOneById(id: ObjectId): Promise<CategoryDocument> {
    return await this.model.findOne({ _id: new ObjectId(id) }).exec();
  }

  async findOneByName(name: string): Promise<CategoryDocument> {
    return await this.model.findOne({ name }).exec();
  }

  async updateOne(body: any, id: string): Promise<any> {
    return await this.model.updateOne({ _id: new ObjectId(id) }, { $set: body }).exec();
  }

  async deleteOne(id: string): Promise<any> {
    const countItems = await this.modelItem
      .find({ category: new ObjectId(id) })
      .count()
      .exec();
    if (countItems > 0) {
      throw new BadRequestException('There are still objects in this category');
    }
    return await this.model.deleteOne({ _id: new ObjectId(id) }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const obj = await this.model.findOne({ _id: new ObjectId(id) }).exec();
    return !!obj?._id;
  }
}
