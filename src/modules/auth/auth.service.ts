import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Context } from '../../context';

@Injectable()
export class AuthService {
  constructor(private usersService: UserService, private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUsernameOrEmail(username, true);
    if (!!user && (await bcrypt.compare(password, user.hash))) {
      return user;
    }
    return null;
  }

  async login(user: any, context: Context) {
    const payload = { username: user.username, userId: user?._id?.toHexString() };
    return {
      access_token: this.jwtService.sign(payload),
      username: user?.username,
      userId: user?._id?.toHexString(),
      email: user?.email,
    };
  }
}
