import { Env } from './config/env';

export class Context {
  public env: Env;
  public user: any;

  public constructor(env: Env, user: any) {
    this.env = env;
    this.user = user;
  }
}
