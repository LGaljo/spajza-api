import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { User } from '../../user/schemas/user.schema';

export type CommentDocument = Comment & Document;

@Schema()
export class Comment {
  @Prop()
  parent_comment_id: ObjectId;

  @Prop()
  item_id: ObjectId;

  @Prop()
  message: string;

  @Prop({ type: ObjectId, ref: 'User' })
  user: User;

  @Prop()
  _createdAt: Date;

  @Prop()
  _deletedAt: Date;
}

export const CommentsSchema = SchemaFactory.createForClass(Comment);
