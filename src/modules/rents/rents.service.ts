import { Injectable } from '@nestjs/common';
import { Context } from 'src/context';
import { InventoryItemsService } from '../inventoryitem/inventoryitem.service';
import { InventoryItem } from '../inventoryitem/schemas/inventoryitem.schema';
import { ObjectId } from 'mongodb';
import { ItemStatus } from '../inventoryitem/schemas/itemstatus.enum';

@Injectable()
export class RentsService {
    constructor(private itemService: InventoryItemsService) {}

    async rentItem(context: Context, id: string, data: any) {
        const item: InventoryItem = await this.itemService.findOne(id);
        item.rents = {
            borrowedAt: new Date(),
            returnTime: data.returnTime,
            renter: new ObjectId(context.user._id),
            subject: data?.subject
        };
        item.status = ItemStatus.BORROWED;
        await this.itemService.updateOne(context, item, id);
        return this.itemService.findOne(id);
    }

    async returnItem(context: Context, id: string) {
        const item: InventoryItem = await this.itemService.findOne(id);
        item.rents = null;
        item.status = ItemStatus.STORED;
        await this.itemService.updateOne(context, item, id);
        return this.itemService.findOne(id);
    }
}
