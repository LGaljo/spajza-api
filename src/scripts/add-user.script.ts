import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication = moduleFixture.createNestApplication();
  await app.init();

  const response = await request(app.getHttpServer()).post('/user').send({
    email: 'luka.galjot@gmail.com',
    username: 'lukag',
    password: 'geslo',
    role: 'ADMIN',
  });
  console.log(response);

  process.exit();
})().catch(async (err) => {
  console.log(err);
});
