import * as dotenv from 'dotenv';

export interface Env {
  API_PORT: number;
  API_HOST: string;
  MONGO_URI: string;
  ON_LINUX: boolean;
}

dotenv.config();

export const env: Env = {
  API_PORT: Number(process.env['API_PORT']),
  API_HOST: process.env['API_HOST'],
  ON_LINUX: Boolean(process.env['ON_LINUX']),
  MONGO_URI: process.env['MONGO_URI'],
};
