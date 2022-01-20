import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private model: Model<CategoryDocument>,
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
    return await this.model.findOne({ _id: id }).exec();
  }

  async findOneByName(name: string): Promise<CategoryDocument> {
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
