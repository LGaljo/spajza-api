import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RequestLogDocument = RequestLog & Document;

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
