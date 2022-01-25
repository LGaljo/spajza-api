import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from './roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ unique: true })
  username: string;

  @Prop({ unique: true })
  email: string;

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
