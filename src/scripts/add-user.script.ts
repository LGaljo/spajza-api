import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../modules/user/schemas/user.schema';
import { Role } from '../modules/user/schemas/roles.enum';
import * as bcrypt from 'bcrypt';
import { env } from '../config/env';
import { Model } from 'mongoose';

(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));

  const email = 'luka.galjot@gmail.com';
  const username = 'lukag';
  const password = 'geslo123';
  const role = Role.ADMIN;

  const existingUser = await userModel.findOne({ $or: [{ email }, { username }] }).exec();
  if (existingUser) {
    console.log(`User '${username}' (${email}) already exists. Updating credentials/role to ADMIN...`);
    existingUser.role = role;
    existingUser.hash = await bcrypt.hash(password, env.SALT_ROUNDS);
    existingUser.salt = env.SALT_ROUNDS;
    await existingUser.save();
    console.log('User successfully updated in the database.');
  } else {
    console.log(`Creating new ADMIN user '${username}' (${email})...`);
    const hash = await bcrypt.hash(password, env.SALT_ROUNDS);
    const user = new userModel({
      email,
      username,
      role,
      hash,
      salt: env.SALT_ROUNDS,
      _createdAt: new Date(),
    });
    await user.save();
    console.log('User successfully created in the database.');
  }

  await app.close();
  process.exit(0);
})().catch(async (err) => {
  console.error('Error during script execution:', err);
  process.exit(1);
});
