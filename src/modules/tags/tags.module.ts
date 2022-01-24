import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagsSchema } from './schemas/tag.schema';
import { InventoryItem, InventoryItemsSchema } from '../inventoryitem/schemas/inventoryitem.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tag.name, schema: TagsSchema }]),
    MongooseModule.forFeature([{ name: InventoryItem.name, schema: InventoryItemsSchema }]),
  ],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
