import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContextMiddleware } from './middlewares/context.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { env } from './config/env';
import { InventoryitemModule } from './modules/inventoryitem/inventoryitem.module';
import { TagsModule } from './modules/tags/tags.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RequestLog, RequestLogSchema } from './modules/request-log/request-log.schema';
import { RequestLogMiddleware } from './middlewares/request-log.middleware';

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGO_URI),
    MongooseModule.forFeature([{ name: RequestLog.name, schema: RequestLogSchema }]),
    UserModule,
    AuthModule,
    InventoryitemModule,
    TagsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer.apply(RequestLogMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
