import { Module } from '@nestjs/common';
import { InventoryitemModule } from '../inventoryitem/inventoryitem.module';
import { RentsController } from './rents.controller';
import { RentsService } from './rents.service';

@Module({
  imports: [InventoryitemModule],
  controllers: [RentsController],
  providers: [RentsService]
})
export class RentsModule {}
