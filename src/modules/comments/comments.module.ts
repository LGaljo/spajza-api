import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TagsModule } from '../tags/tags.module';
import { CategoriesModule } from '../categories/categories.module';
import { CountersModule } from '../counters/counters.module';
import { TracingModule } from '../tracing/tracing.module';
import { Comment, CommentsSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentsSchema }]),
    TagsModule,
    CategoriesModule,
    CountersModule,
    TracingModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
