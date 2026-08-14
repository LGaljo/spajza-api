import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema()
export class Reservation {
  @Prop({ type: ObjectId, ref: 'InventoryItem', required: true })
  item: ObjectId;

  @Prop({ type: ObjectId, ref: 'User', required: true })
  user: ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  subject: string;

  @Prop({ default: new Date() })
  _createdAt: Date;

  @Prop()
  _updatedAt: Date;

  @Prop()
  _deletedAt: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.index({ item: 1, _deletedAt: 1 });
ReservationSchema.index({ user: 1, _deletedAt: 1 });
