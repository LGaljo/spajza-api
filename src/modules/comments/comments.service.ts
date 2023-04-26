import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { ObjectId } from 'mongodb';
import { Context } from '../../context';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private model: Model<CommentDocument>,
  ) {}

  async getCommentsForItem(query) {
    return this.model
      .find({
        item_id: query.item_id,
        parent_comment_id: query.parent_id,
      })
      .populate({ path: 'user', model: 'User' })
      .exec();
  }

  async create(data: any, context: Context) {
    const comment = new this.model({
      message: data.message,
      user: context.user._id,
      item: data.item._id,
      _createdAt: Date.now(),
    });
    await comment.save();
  }

  async delete(id: string) {
    const comment = await this.model.findOne({ _id: new ObjectId(id) }).exec();
    comment._deletedAt = new Date();
    await comment.save();
  }
}
