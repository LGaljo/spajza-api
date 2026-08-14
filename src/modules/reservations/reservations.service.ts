import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Context } from '../../context';
import { Reservation, ReservationDocument } from './reservation.schema';
import { ObjectId } from 'mongodb';
import { Role } from '../user/schemas/roles.enum';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private model: Model<ReservationDocument>,
  ) {}

  async create(context: Context, body: any) {
    const { item, startDate, endDate, subject } = body;

    if (!item || !startDate || !endDate) {
      throw new BadRequestException('Item, start date, and end date are required.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date.');
    }

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date.');
    }

    const reservation = new this.model({
      item: new ObjectId(item),
      user: new ObjectId(context.user?._id),
      startDate: start,
      endDate: end,
      subject,
    });

    await reservation.save();
    return reservation;
  }

  async findAll() {
    return this.model
      .find({ _deletedAt: null })
      .populate('item')
      .populate({ path: 'user', model: 'User', select: 'username email' })
      .exec();
  }

  async update(context: Context, id: string, body: any) {
    const reservation = await this.model.findOne({ _id: new ObjectId(id), _deletedAt: null }).exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      reservation.user?.toString() !== context.user?._id?.toString()
    ) {
      throw new ForbiddenException('You can only update your own reservations.');
    }

    const updateData: any = {};
    if (body.startDate) {
      const start = new Date(body.startDate);
      if (isNaN(start.getTime())) throw new BadRequestException('Invalid start date.');
      updateData.startDate = start;
    }
    if (body.endDate) {
      const end = new Date(body.endDate);
      if (isNaN(end.getTime())) throw new BadRequestException('Invalid end date.');
      updateData.endDate = end;
    }

    if (updateData.startDate || updateData.endDate) {
      const currentStart = updateData.startDate || reservation.startDate;
      const currentEnd = updateData.endDate || reservation.endDate;
      if (currentStart >= currentEnd) {
        throw new BadRequestException('Start date must be before end date.');
      }
    }

    if (body.subject !== undefined) {
      updateData.subject = body.subject;
    }

    if (body.item) {
      updateData.item = new ObjectId(body.item);
    }

    updateData._updatedAt = new Date();

    await this.model.updateOne({ _id: new ObjectId(id) }, { $set: updateData }).exec();
    return this.model.findOne({ _id: new ObjectId(id) }).populate('item').populate({ path: 'user', model: 'User', select: 'username email' }).exec();
  }

  async remove(context: Context, id: string) {
    const reservation = await this.model.findOne({ _id: new ObjectId(id), _deletedAt: null }).exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      reservation.user?.toString() !== context.user?._id?.toString()
    ) {
      throw new ForbiddenException('You can only delete your own reservations.');
    }

    await this.model.updateOne({ _id: new ObjectId(id) }, { $set: { _deletedAt: new Date() } }).exec();
  }
}
