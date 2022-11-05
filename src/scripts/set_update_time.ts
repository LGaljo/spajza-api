import { AppModule } from '../app.module';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InventoryItemsService } from '../modules/inventoryitem/inventoryitem.service';

let app: INestApplicationContext;
(async () => {
  app = await NestFactory.createApplicationContext(AppModule);
  const iservice = app.get<InventoryItemsService>(InventoryItemsService);

  const items = await iservice.findAll(300);

  for (const item of items) {
    console.log(item.name);
    if (!item?._updatedAt) {
      item._updatedAt = item._createdAt;
      await item.save();
    }
  }

  process.exit();
})().catch(async (err) => {
  console.log(err);
});
