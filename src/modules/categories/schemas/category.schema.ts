import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CategoryDocument = Category & Document;

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
