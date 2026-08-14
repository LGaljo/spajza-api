import { Injectable, ForbiddenException } from '@nestjs/common';
import { Context } from '../../context';
import { InventoryItemsService } from '../inventoryitem/inventoryitem.service';
import { InventoryItem } from '../inventoryitem/schemas/inventoryitem.schema';
import { ObjectId } from 'mongodb';
import { ItemStatus } from '../inventoryitem/schemas/itemstatus.enum';
import { Role } from '../user/schemas/roles.enum';
import { TracingService } from '../tracing/tracing.service';

@Injectable()
export class RentsService {
  constructor(
    private itemService: InventoryItemsService,
    private tracingService: TracingService,
  ) {}

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

  async returnItem(context: Context, id: string, data: any = {}) {
    const item: InventoryItem = await this.itemService.findOne(id);
    const beforeObj = JSON.parse(JSON.stringify(item));

    if (
      context.user.role !== Role.ADMIN &&
      context.user.role !== Role.KEEPER &&
      item.rents?.renter &&
      item.rents.renter.toString() !== context.user._id.toString()
    ) {
      throw new ForbiddenException('Only the renter, a keeper, or an admin can return this item.');
    }
    
    if (data?.conditionReport) {
      item.status = ItemStatus.NEEDS_REPAIR;
      item.extras = { ...item.extras, conditionReport: data.conditionReport };
      await this.tracingService.saveChange('defect-reporting', beforeObj, item, context.user._id.toString());
    } else {
      item.status = ItemStatus.STORED;
    }
    
    item.rents = null;
    await this.itemService.updateOne(context, item, id);
    return this.itemService.findOne(id);
  }
}
