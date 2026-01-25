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
      const tags = await this.tagModel
        .find({ name: { $in: object.tagNames }, _deletedAt: null })
        .select({ _id: 1 })
        .exec();
      object.tags = tags.map((t) => t._id);
    } else if (object?.tags) {
      object.tags = object.tags.map((t: any) => new ObjectId(t));
    }

    if (object?.category) {
      object.category = new ObjectId(object.category);
    } else if (object?.categoryName) {
      const doc = await this.categoryModel
        .findOne({ name: object.categoryName, _deletedAt: null })
        .select({ _id: 1 })
        .exec();
      object.category = doc?._id ?? null;
    }

    object.nngrams = toNgrams(object.name);
    object.code = await this.countersService.getLatestCode('items');
    const createdInventoryItem = new this.inventoryItemModel(object);
    await createdInventoryItem.save();
    // await this.tracingService.saveChange('inventoryitem', 'create', null, object);
    return createdInventoryItem;
  }

  async createMany(objects: any[]): Promise<InventoryItemDocument[]> {
    if (!objects?.length) {
      return [];
    }

    const tagNames = new Set<string>();
    const categoryNames = new Set<string>();
    for (const object of objects) {
      if (Array.isArray(object?.tagNames)) {
        for (const name of object.tagNames) {
          tagNames.add(name);
        }
      }
      if (object?.categoryName) {
        categoryNames.add(object.categoryName);
      }
    }

    const [tags, categories, codes] = await Promise.all([
      tagNames.size
        ? this.tagModel
            .find({ name: { $in: Array.from(tagNames) }, _deletedAt: null })
            .select({ _id: 1, name: 1 })
            .lean()
            .exec()
        : [],
      categoryNames.size
        ? this.categoryModel
            .find({ name: { $in: Array.from(categoryNames) }, _deletedAt: null })
            .select({ _id: 1, name: 1 })
            .lean()
            .exec()
        : [],
      Promise.all(objects.map(() => this.countersService.getLatestCode('items'))),
    ]);

    const tagsByName = new Map<string, ObjectId>(
      tags.map((t: any): [string, ObjectId] => [t.name, t._id]),
    );
    const categoriesByName = new Map<string, ObjectId>(
      categories.map((c: any): [string, ObjectId] => [c.name, c._id]),
    );

    const docs = objects.map((object, index) => {
      const doc = { ...object };

      if (doc?.tagNames) {
        doc.tags = doc.tagNames.map((t: string) => tagsByName.get(t)).filter(Boolean);
      } else if (doc?.tags) {
        doc.tags = doc.tags.map((t: any) => new ObjectId(t));
      }

      if (doc?.category) {
        doc.category = new ObjectId(doc.category);
      } else if (doc?.categoryName) {
        doc.category = categoriesByName.get(doc.categoryName) ?? null;
      }

      doc.nngrams = toNgrams(doc.name);
      doc.code = codes[index];

      return doc;
    });

    return (await this.inventoryItemModel.insertMany(docs)) as InventoryItemDocument[];
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
    const asArray = (value: any) => {
      if (!value) {
        return [];
      }
      return Array.isArray(value) ? value : [value];
    };
    if (category) {
      filter['category'] = { $in: asArray(category).map((t: any) => new ObjectId(t)) };
    }
    if (tags) {
      filter['tags'] = { $in: asArray(tags).map((t: any) => new ObjectId(t)) };
    }
    if (statuses) {
      filter['status'] = { $in: asArray(statuses).map((s: any) => s) };
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
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<any> {
    return this.inventoryItemModel
      .findOne({ _id: new ObjectId(id), _deletedAt: null })
      .populate('category')
      .populate('tags')
      .populate({ path: 'rents.renter', model: 'User' })
      .lean()
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
    // console.log(file.mimetype);

    const image = await sharp(file.buffer)
      .resize({ fit: 'cover', width: 800, height: 800 })
      .jpeg({ mozjpeg: true, quality: 90 })
      .toBuffer();

    const response = await s3.upload(key, 'image/jpeg', image);

    await this.inventoryItemModel
      .updateOne(
        { _id: new ObjectId(id) },
        { $push: { cover: response }, $set: { _updatedAt: new Date() } },
      )
      .exec();
    // await this.inventoryItemModel
    //   .updateOne({ _id: new ObjectId(id) }, { $set: { cover: response, _updatedAt: new Date() } })
    //   .exec();
  }

  async removeCoverImage(key: string, _id: string) {
    await this.inventoryItemModel
      .updateOne(
        { _id: new ObjectId(_id) },
        { $pull: { cover: { key } }, $set: { _updatedAt: new Date() } },
      )
      .exec();
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
