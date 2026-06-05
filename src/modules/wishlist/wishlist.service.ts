import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Context } from '../../context';
import { Wishlist, WishlistDocument } from './wishlist.schema';
import { ObjectId } from 'mongodb';
import { Role } from '../user/schemas/roles.enum';

@Injectable()
export class WishlistService {
  constructor(@InjectModel(Wishlist.name) private model: Model<WishlistDocument>) {}

  async createItem(context: Context, body: any) {
    const item = new this.model(body);
    item.user = context.user?._id;
    await item.save();
    return item;
  }

  async updateItem(context: Context, id: string, body: any) {
    const item = await this.model.findOne({ _id: new ObjectId(id) });
    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }
    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      item.user?.toString() !== context.user?._id?.toString()
    ) {
      throw new ForbiddenException('You can only update your own wishlist items.');
    }
    return this.model.updateOne({ _id: new ObjectId(id) }, { $set: body }).exec();
  }

  async getItems() {
    return this.model.find({ _deletedAt: null }).sort({ order: 1 }).lean().exec();
  }

  async removeItem(context: Context, id: string) {
    const item = await this.model.findOne({ _id: new ObjectId(id) });
    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }
    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      item.user?.toString() !== context.user?._id?.toString()
    ) {
      throw new ForbiddenException('You can only delete your own wishlist items.');
    }
    await this.model.updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: new Date() } }).exec();
  }
}
