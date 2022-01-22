import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesSchema, Category } from './schemas/category.schema';
import { CategoriesController } from './categories.controller';
import { InventoryItem, InventoryItemsSchema } from '../songs/schemas/inventoryitem.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategoriesSchema }]),
    MongooseModule.forFeature([{ name: InventoryItem.name, schema: InventoryItemsSchema }]),
  ],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
