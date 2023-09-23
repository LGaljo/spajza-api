import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { ObjectId } from 'mongodb';
import { InventoryItem, InventoryItemDocument } from '../inventoryitem/schemas/inventoryitem.schema';
import * as sharp from 'sharp';
import * as s3 from '../../lib/aws_s3';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(InventoryItem.name) private itemModel: Model<InventoryItemDocument>,
  ) {}

  async create(object: any): Promise<CategoryDocument> {
    const item = new this.categoryModel(object);
    await item.save();
    return item;
  }

  async findAll(options: any): Promise<CategoryDocument[]> {
    const filter = { _deletedAt: null };
    if (options?.url) {
      filter['url'] = { $ne: null };
    }
    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  async findOneById(id: ObjectId): Promise<CategoryDocument & Category & { _id: Types.ObjectId }> {
    const obj = await this.categoryModel
      .findOne({ _id: new ObjectId(id), _deletedAt: null })
      .exec();
    if (!obj?._id) {
      throw new BadRequestException('Specified category does not exist');
    }
    return obj;
  }

  async findOneByName(name: string): Promise<CategoryDocument> {
    return this.categoryModel.findOne({ name, _deletedAt: null }).exec();
  }

  async updateOne(body: any, id: string): Promise<any> {
    return this.categoryModel
      .updateOne({ _id: new ObjectId(id), _deletedAt: null }, { $set: body })
      .exec();
  }

  async deleteOne(id: string): Promise<any> {
    const countItems = await this.categoryModel
      .find({ category: new ObjectId(id), _deletedAt: null })
      .count()
      .exec();
    if (countItems > 0) {
      throw new BadRequestException('There are still objects in this category');
    }
    await this.categoryModel
      .updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: new Date() } })
      .exec();
  }

  async updateTemplateImage(file: any, id: string): Promise<any> {
    const category = await this.findOneById(new ObjectId(id));

    const key = `category/${id}/original_${new ObjectId().toHexString()}.${
      file.mimetype.split('/')[1]
    }`;

    const image = await sharp(file.buffer)
      .resize({ fit: 'inside', width: 1000, height: 1000 })
      .jpeg({ mozjpeg: true, quality: 90 })
      .toBuffer();

    const response = await s3.upload(key, 'image/jpeg', image);
    await this.categoryModel
      .updateOne(
        { _id: category._id },
        { $set: { templateImage: response, _updatedAt: new Date() } },
      )
      .exec();
  }

  async removeTemplateImage(id: string): Promise<any> {
    const category = await this.findOneById(new ObjectId(id));
    await this.categoryModel.updateOne({ _id: category._id }, { $unset: { templateImage: '' } });
    await s3.remove(category.templateImage.Key);
  }
}
