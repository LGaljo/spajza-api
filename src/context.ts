import { Env } from './config/env';

export class Context {
  public env: Env;

  public constructor(env: Env) {
    this.env = env;
  }
}
