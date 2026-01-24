import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema()
export class Tag {
  @Prop()
  name: string;

  @Prop()
  _deletedAt: Date;
}

export const TagsSchema = SchemaFactory.createForClass(Tag);
