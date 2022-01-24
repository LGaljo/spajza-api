import { env } from '../../config/env';

import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createDto: any): Promise<UserDocument> {
    const createdUser = new this.userModel(createDto);
    createdUser.hash = await bcrypt.hash(createDto.password, env.SALT_ROUNDS);
    createdUser.salt = env.SALT_ROUNDS;
    await createdUser.save();
    return createdUser;
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOneByUsername(username: string): Promise<UserDocument> {
    return this.userModel.findOne({ username: username }).exec();
  }

  async findOneById(id: string): Promise<UserDocument> {
    return this.userModel.findOne({ _id: new ObjectId(id) }).exec();
  }
}
