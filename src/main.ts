import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { env } from './config/env';

async function bootstrap() {
  const corsOrigin = env.APP_URL || '*';

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(helmet());

  await app.listen(env.PORT, env.HOST);
  console.log(`API server listening on ${env.HOST}:${env.PORT}`);
  return app;
}

bootstrap().catch((err) => console.error(err));
