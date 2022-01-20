import { Module } from '@nestjs/common';
import { InventoryItemsService, } from './inventoryitem.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItemsController } from './inventoryitem.controller';
import { Tag, TagsSchema } from '../tags/schemas/tag.schema';
import {
  InventoryItem,
  InventoryItemsSchema,
} from './schemas/inventoryitem.schema';
import {
  CategoriesSchema,
  Category,
} from '../categories/schemas/category.schema';
import { TagsModule } from '../tags/tags.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategoriesSchema },
      { name: InventoryItem.name, schema: InventoryItemsSchema },
      { name: Tag.name, schema: TagsSchema },
    ]),
    TagsModule,
    CategoriesModule,
  ],
  providers: [InventoryItemsService],
  controllers: [InventoryItemsController],
  exports: [InventoryItemsService],
})
export class InventoryitemModule {}
