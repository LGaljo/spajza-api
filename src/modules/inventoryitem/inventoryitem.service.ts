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
import { Trace, TraceDocument } from '../tracing/schema/tracing.schema';
import { TracingService } from '../tracing/tracing.service';

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
    await this.tracingService.saveChange('inventoryitem', 'create', null, object);
    return createdInventoryItem;
  }

  async findAll(limit = 50, skip = 0, query: any): Promise<any> {
    const { category, tags, statuses, search } = query;
    const filter = {};
    let sort: any = { _id: -1 };
    category ? (filter['category'] = new ObjectId(category)) : null;
    if (tags) {
      filter['tags'] = { $in: tags.map((t: any) => new ObjectId(t)) };
    }
    if (statuses) {
      filter['status'] = { $in: statuses.map((s: any) => s) };
    }
    if (search) {
      filter['$text'] = { $search: search };
      sort = { score: { $meta: 'textScore' } };
    }

    return await this.inventoryItemModel
      .aggregate([
        { $match: filter },
        // { $limit: limit },
        // { $skip: skip },
        { $unwind: { path: '$tags', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryobj',
          },
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tagsgroup',
          },
        },
        { $unwind: { path: '$tagsgroup', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$categoryobj', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            code: { $first: '$code' },
            tags: { $addToSet: '$tagsgroup' },
            category: { $first: '$categoryobj' },
            categoryId: { $first: '$category' },
            boughtTime: { $first: '$boughtTime' },
            _createdAt: { $first: '$_createdAt' },
            retired: { $first: '$retired' },
            description: { $first: '$description' },
            count: { $first: '$count' },
            location: { $first: '$location' },
            owner: { $first: '$owner' },
            status: { $first: '$status' },
          },
        },
        { $sort: sort },
      ])
      .exec();
  }

  async findOne(id: string): Promise<any> {
    return this.inventoryItemModel
      .aggregate([
        {
          $match: { _id: new ObjectId(id) },
        },
        { $unwind: { path: '$tags', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryobj',
          },
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tagsgroup',
          },
        },
        { $unwind: { path: '$tagsgroup', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$categoryobj', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            code: { $first: '$code' },
            tags: { $addToSet: '$tagsgroup' },
            category: { $first: '$categoryobj' },
            categoryId: { $first: '$category' },
            boughtTime: { $first: '$boughtTime' },
            _createdAt: { $first: '$_createdAt' },
            retired: { $first: '$retired' },
            description: { $first: '$description' },
            count: { $first: '$count' },
            location: { $first: '$location' },
            owner: { $first: '$owner' },
            status: { $first: '$status' },
          },
        },
      ])
      .exec()
      .then((doc: any[]) => doc[0]);
  }

  async updateOne(object: any, id: string): Promise<any> {
    const objBefore = await this.inventoryItemModel.findOne({ _id: new ObjectId(id) }).exec();

    object.nngrams = toNgrams(object.name);
    if (object?.category) {
      object.category = new ObjectId(object.category);
    }
    if (object?.tags) {
      object.tags = object.tags.map((t: any) => new ObjectId(t));
    }

    await this.tracingService.saveChange('inventoryitem', 'update', objBefore, object);

    return await this.inventoryItemModel
      .updateOne({ _id: new ObjectId(id) }, { $set: object })
      .exec();
  }

  async exists(_id: string): Promise<boolean> {
    const obj = await this.inventoryItemModel.findOne({ _id }).exec();
    return !!obj?._id;
  }

  async deleteItem(_id: string) {
    const objBefore = await this.inventoryItemModel.findOne({ _id: new ObjectId(_id) }).exec();
    await this.tracingService.saveChange('inventoryitem', 'remove', objBefore, null);
    await this.inventoryItemModel.deleteOne({ _id }).exec();
  }
}
