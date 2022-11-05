import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Context } from '../../context';
import { Wishlist, WishlistDocument } from './wishlist.schema';
import { ObjectId } from 'mongodb';

@Injectable()
export class WishlistService {
    constructor(
        @InjectModel(Wishlist.name) private model: Model<WishlistDocument>
    ) { }

    async createItem(context: Context, body: any) {
        const item = new this.model(body);
        item.user = context.user?._id
        await item.save();
        return item;
    }

    async updateItem(context: Context, id: number, body: any) {
        return this.model.updateOne({ _id: new ObjectId(id) }, { $set: body }).exec();
    }

    async getItems(context: Context) {
        return this.model.find().sort({ order: 1 }).exec();
    }

    async removeItem(context: Context, id: number) {
        return this.model.deleteOne({ _id: new ObjectId(id) }).exec();
    }
}
