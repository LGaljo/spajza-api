import { Module } from '@nestjs/common';
import { CountersService } from './counters.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Counters, CountersSchema } from './counter.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Counters.name, schema: CountersSchema }])],
  providers: [CountersService],
  exports: [CountersService],
})
export class CountersModule {}
