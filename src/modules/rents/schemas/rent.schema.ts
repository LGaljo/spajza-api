import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { User } from '../../user/schemas/user.schema';

export type RentsDocument = Rents & Document;

@Schema()
export class Rents {
  @Prop({ type: ObjectId, ref: 'User' })
  userId: User;

  @Prop()
  returnTime: Date;

  @Prop()
  subject: string;
}

export const RentsSchema = SchemaFactory.createForClass(Rents);
