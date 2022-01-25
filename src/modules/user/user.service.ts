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

  async findAll(keepHash = false): Promise<User[]> {
    const docs = await this.userModel.find().exec();

    if (keepHash) {
      return docs;
    }

    return docs.map((doc) => {
      delete doc.hash;
      delete doc.salt;
      return doc;
    });
  }

  async findOneByUsernameOrEmail(value: string, keepHash = false): Promise<UserDocument> {
    const obj = await this.userModel
      .findOne({ $or: [{ username: value }, { email: value }] })
      .exec();

    if (!keepHash) {
      delete obj.hash;
      delete obj.salt;
    }
    return obj;
  }

  async findOneById(id: string, keepHash = false): Promise<UserDocument> {
    const obj = await this.userModel.findOne({ _id: new ObjectId(id) }).exec();

    if (!keepHash) {
      delete obj.hash;
      delete obj.salt;
    }
    return obj;
  }
}
