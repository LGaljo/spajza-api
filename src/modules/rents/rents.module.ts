import { Module } from '@nestjs/common';
import { InventoryitemModule } from '../inventoryitem/inventoryitem.module';
import { RentsController } from './rents.controller';
import { RentsService } from './rents.service';
import { RentsSchedulerService } from './rents-scheduler.service';
import { TracingModule } from '../tracing/tracing.module';

@Module({
  imports: [InventoryitemModule, TracingModule],
  controllers: [RentsController],
  providers: [RentsService, RentsSchedulerService],
})
export class RentsModule {}
