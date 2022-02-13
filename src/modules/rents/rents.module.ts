import { Module } from '@nestjs/common';
import { RentsController } from './rents.controller';
import { RentsService } from './rents.service';

@Module({
  controllers: [RentsController],
  providers: [RentsService]
})
export class RentsModule {}
