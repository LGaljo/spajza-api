import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InventoryItem, InventoryItemDocument } from './schemas/inventoryitem.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Tag, TagDocument } from '../tags/schemas/tag.schema';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { toNgrams } from '../../lib/utils';
import { CategoriesService } from '../categories/categories.service';
import { TagsService } from '../tags/tags.service';
import { CountersService } from '../counters/counters.service';
import { TracingService } from '../tracing/tracing.service';
import { Trace, TraceDocument } from '../tracing/schema/tracing.schema';
import { Context } from '../../context';
import * as s3 from '../../lib/aws_s3';
import * as sharp from 'sharp';

@Injectable()
export class InventoryItemsService {
  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Tag.name)
    private tagModel: Model<TagDocument>,
    @InjectModel(Trace.name)
    private traceModel: Model<TraceDocument>,
    private tracingService: TracingService,
    private categoryService: CategoriesService,
    private tagService: TagsService,
    private countersService: CountersService,
  ) {}

  async create(object: any): Promise<InventoryItemDocument> {
    if (object?.tagNames) {
      object.tags = object.tagNames
        .map(async (t: any) => {
          const doc: any = await this.tagService.findOneByName(t);
          return doc ? doc._id : null;
        })
        .filter((t) => t !== null);
    } else if (object?.tags) {
      object.tags = object.tags.map((t: any) => new ObjectId(t));
    }

    if (object?.category) {
      object.category = new ObjectId(object.category);
    } else if (object?.categoryName) {
      const doc: any = await this.categoryService.findOneByName(object.categoryName);
      object.category = doc?._id;
    }

    object.nngrams = toNgrams(object.name);
    object.code = await this.countersService.getLatestCode('items');
    const createdInventoryItem = new this.inventoryItemModel(object);
    await createdInventoryItem.save();
    // await this.tracingService.saveChange('inventoryitem', 'create', null, object);
    return createdInventoryItem;
  }

  async findAll(
    limit = 50,
    skip = 0,
    sort_field = null,
    sort_dir = 'asc',
    query: any = {},
  ): Promise<any> {
    const { category, tags, statuses, search } = query;
    const filter = { _deletedAt: null };
    const sort: any = {};
    if (category) {
      filter['category'] = { $in: category.map((t: any) => new ObjectId(t)) };
    }
    if (tags) {
      filter['tags'] = { $in: tags.map((t: any) => new ObjectId(t)) };
    }
    if (statuses) {
      filter['status'] = { $in: statuses.map((s: any) => s) };
    }
    if (sort_field) {
      sort[sort_field] = sort_dir === 'asc' ? 1 : -1;
      sort['_id'] = 1;
    }
    if (search) {
      filter['$text'] = { $search: search };
      sort['score'] = { $meta: 'textScore' };
    }

    return this.inventoryItemModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category')
      .populate('tags')
      .populate({ path: 'rents.renter', model: 'User' })
      .exec();
  }

  async findOne(id: string): Promise<any> {
    return this.inventoryItemModel
      .findOne({ _id: new ObjectId(id), _deletedAt: null })
      .populate('category')
      .populate('tags')
      .populate({ path: 'rents.renter', model: 'User' })
      .exec();
  }

  async updateOne(context: Context, object: any, id: string): Promise<any> {
    const objBefore = await this.inventoryItemModel.findOne({ _id: new ObjectId(id) }).exec();

    object.nngrams = toNgrams(object.name);
    if (object?.categoryId) {
      object.category = new ObjectId(object.categoryId);
    }
    if (object?.tags && object.tags.length && !(object.tags[0] instanceof Object)) {
      object.tags = object.tags.map((t: any) => new ObjectId(t));
    }

    // object.cover = objBefore.cover;
    object._updatedAt = new Date();
    delete object.categoryId;
    await this.tracingService.saveChange('inventoryitem', objBefore, object, context?.user._id);

    await this.inventoryItemModel.updateOne({ _id: new ObjectId(id) }, { $set: object }).exec();

    return this.findOne(object._id);
  }

  async addCoverImage(file: any, id: string): Promise<any> {
    const key = `item/${id}/original_${new ObjectId().toHexString()}.${
      file.mimetype.split('/')[1]
    }`;
    const item = await this.inventoryItemModel.findOne({ _id: new ObjectId(id) }).exec();

    const image = await sharp(file.buffer)
      .resize({ fit: 'cover', width: 800, height: 800 })
      .jpeg({ mozjpeg: true, quality: 90 })
      .toBuffer();

    const response = await s3.upload(key, 'image/jpeg', image);
    const ims = [...item.cover, response];
    item.cover = ims;
    await item.save();
    // await this.inventoryItemModel
    //   .updateOne({ _id: new ObjectId(id) }, { $set: { cover: response, _updatedAt: new Date() } })
    //   .exec();
  }

  async removeCoverImage(key: string, _id: string) {
    const item = await this.inventoryItemModel.findOne({ _id: new ObjectId(_id) }).exec();
    item.cover = item.cover.filter((im: any) => im.key !== key);
    await item.save();
    await s3.remove(key);
  }

  // async exists(_id: string): Promise<boolean> {
  //   const obj = await this.inventoryItemModel.findOne({ _id, _deletedAt: null }).exec();
  //   return !!obj?._id;
  // }

  async deleteItem(_id: string) {
    const item = await this.findOne(_id);
    if (item?.cover?.key) {
      await s3.remove(item?.cover?.key);
    }
    await this.inventoryItemModel.updateOne({ _id }, { $set: { _deletedAt: new Date() } }).exec();
  }
}
