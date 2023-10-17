import { AppModule } from '../app.module';
import { InventoryItemsService } from '../modules/inventoryitem/inventoryitem.service';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

let app: INestApplicationContext;

(async () => {
  app = await NestFactory.createApplicationContext(AppModule);
  const iservice = app.get<InventoryItemsService>(InventoryItemsService);

  const items = await iservice.findAll(1000);
  for (const item of items) {
    if (item?.cover && !item?.cover?.length) {
      item.cover = [item.cover];
      await item.save();
    }
  }

  process.exit();
})().catch(async (err) => {
  console.log(err);
});
