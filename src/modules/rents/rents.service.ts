import { Injectable, ForbiddenException } from '@nestjs/common';
import { Context } from '../../context';
import { InventoryItemsService } from '../inventoryitem/inventoryitem.service';
import { InventoryItem } from '../inventoryitem/schemas/inventoryitem.schema';
import { ObjectId } from 'mongodb';
import { ItemStatus } from '../inventoryitem/schemas/itemstatus.enum';
import { Role } from '../user/schemas/roles.enum';

@Injectable()
export class RentsService {
  constructor(private itemService: InventoryItemsService) {}

  async rentItem(context: Context, id: string, data: any) {
    const item: InventoryItem = await this.itemService.findOne(id);
    item.rents = {
      borrowedAt: new Date(),
      returnTime: data.returnTime,
      renter: new ObjectId(context.user._id),
      subject: data?.subject,
    };
    item.status = ItemStatus.BORROWED;
    await this.itemService.updateOne(context, item, id);
    return this.itemService.findOne(id);
  }

  async returnItem(context: Context, id: string) {
    const item: InventoryItem = await this.itemService.findOne(id);
    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      item.rents?.renter &&
      item.rents.renter.toString() !== context.user._id.toString()
    ) {
      throw new ForbiddenException('Only the renter, a keeper, or an admin can return this item.');
    }
    item.rents = null;
    item.status = ItemStatus.STORED;
    await this.itemService.updateOne(context, item, id);
    return this.itemService.findOne(id);
  }
}
