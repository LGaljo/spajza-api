import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type TraceDocument = Trace & Document;

@Schema()
export class Trace {
  @Prop()
  type: string;

  @Prop({ type: ObjectId })
  originalObjectId: ObjectId;

  @Prop()
  changes: Array<any>;

  @Prop()
  user: ObjectId;

  @Prop({ default: new Date() })
  _createdAt: Date;
}

export const TracesSchema = SchemaFactory.createForClass(Trace);
