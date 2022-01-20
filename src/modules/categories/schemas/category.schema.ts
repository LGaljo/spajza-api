import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type CategoryDocument = Category & Document;

@Schema()
export class Category {
  @Prop()
  name: string;
}

export const CategoriesSchema = SchemaFactory.createForClass(Category);
