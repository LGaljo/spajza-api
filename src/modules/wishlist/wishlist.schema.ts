import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type WishlistDocument = Wishlist & Document;

@Schema()
export class Wishlist {
  @Prop({ type: ObjectId, ref: 'User' })
  user: ObjectId;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop()
  fullfiled: Date;

  @Prop()
  name: string;

  @Prop()
  order: number;

  @Prop({ default: new Date() })
  _createdAt: Date;

  @Prop()
  _updatedAt: Date;

  @Prop()
  _deletedAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
