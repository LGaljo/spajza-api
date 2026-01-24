import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RequestLogDocument = HydratedDocument<RequestLog>;

@Schema()
export class RequestLog {
  @Prop()
  timestamp: string;

  @Prop()
  username: string;

  @Prop()
  url: string;

  @Prop()
  method: string;

  @Prop()
  body: string;

  @Prop()
  origin: string;

  @Prop()
  duration: number;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
