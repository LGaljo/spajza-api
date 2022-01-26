import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CountersDocument = Counters & Document;

@Schema()
export class Counters {
  @Prop()
  key: string;

  @Prop({ default: 0 })
  value: number;
}

export const CountersSchema = SchemaFactory.createForClass(Counters);
