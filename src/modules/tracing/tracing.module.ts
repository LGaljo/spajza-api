import { Module } from '@nestjs/common';
import { TracingService } from './tracing.service';
import { TracingController } from './tracing.controller';
import { Trace, TracesSchema } from './schema/tracing.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Trace.name, schema: TracesSchema }])],
  providers: [TracingService],
  controllers: [TracingController],
  exports: [TracingService],
})
export class TracingModule {}
