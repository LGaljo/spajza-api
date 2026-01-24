import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema()
export class Category {
  @Prop()
  name: string;

  @Prop({ type: Object })
  templateImage: any;

  @Prop()
  _deletedAt: Date;
}

export const CategoriesSchema = SchemaFactory.createForClass(Category);
CategoriesSchema.index({ name: 1, _deletedAt: 1 });
