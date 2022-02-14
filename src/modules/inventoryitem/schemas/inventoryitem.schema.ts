import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Tag } from '../../tags/schemas/tag.schema';
import { ObjectId } from 'mongodb';
import { ItemStatus } from './itemstatus.enum';

export type InventoryItemDocument = InventoryItem & Document;

// db.getCollection('inventoryitems').createIndex({nngrams: "text"})

@Schema()
export class InventoryItem {
  @Prop()
  name: string;

  @Prop()
  nngrams: string;

  @Prop()
  code: number;

  @Prop()
  owner: string;

  @Prop()
  location: string;

  @Prop()
  count: number;

  @Prop({ type: Array, ref: 'Tag', default: [] })
  tags: Tag[];

  @Prop()
  description: string;

  @Prop({ default: false })
  retired: boolean;

  @Prop({ default: ItemStatus.NEW })
  status: string;

  @Prop({ type: Object })
  cover: any;

  @Prop({ type: Object })
  rents: any;

  @Prop({ type: ObjectId, ref: 'Category' })
  category: Category;

  @Prop({ default: new Date() })
  _createdAt: Date;

  @Prop({ default: new Date() })
  boughtTime: Date;
}

export const InventoryItemsSchema = SchemaFactory.createForClass(InventoryItem);
