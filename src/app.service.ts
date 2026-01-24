import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): Record<string, string> {
    return {
      name: 'Spajza API',
      version: '1.0.0',
    };
  }
}
