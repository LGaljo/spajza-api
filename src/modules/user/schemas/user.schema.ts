import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from './roles';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
  username: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop({
    enum: Role,
    default: Role.UNAPPROVED,
    type: String,
  })
  role: string;

  @Prop()
  hash: string;

  @Prop()
  salt: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
