import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type TagDocument = Tag & Document;

@Schema()
export class Tag {
  @Prop()
  name: string;

  @Prop()
  _deletedAt: Date;
}

export const TagsSchema = SchemaFactory.createForClass(Tag);
