import * as dotenv from 'dotenv';

export interface Env {
  PORT: number;
  HOST: string;
  MONGO_URI: string;
  ON_LINUX: boolean;
}

dotenv.config();

export const env: Env = {
  PORT: Number(process.env['PORT']),
  HOST: process.env['HOST'],
  ON_LINUX: Boolean(process.env['ON_LINUX']),
  MONGO_URI: process.env['MONGO_URI'],
};
