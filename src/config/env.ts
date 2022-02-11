import * as dotenv from 'dotenv';

export interface Env {
  PORT: number;
  HOST: string;
  MONGO_URI: string;
  ON_LINUX: boolean;
  JWT_SECRET: string;
  SALT_ROUNDS: number;
  AWS_KEY: string;
  AWS_SECRET: string;
  AWS_REG: string;
  AWS_BUCKET: string;
}

dotenv.config();

export const env: Env = {
  PORT: Number(process.env['PORT']),
  HOST: process.env['HOST'],
  ON_LINUX: Boolean(process.env['ON_LINUX']),
  MONGO_URI: process.env['MONGO_URI'],
  JWT_SECRET: process.env['JWT_SECRET'],
  SALT_ROUNDS: Number(process.env['SALT_ROUNDS']),
  AWS_KEY: process.env['AWS_KEY'],
  AWS_SECRET: process.env['AWS_SECRET'],
  AWS_REG: process.env['AWS_REG'],
  AWS_BUCKET: process.env['AWS_BUCKET'],
};
