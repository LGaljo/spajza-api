import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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

  async login(user: any, saveme: boolean) {
    const payload = {
      username: user.username,
      userId: user?._id?.toHexString(),
      email: user?.email,
      role: user?.role,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: saveme ? '7d' : '2d',
      }),
      username: user?.username,
      userId: user?._id?.toHexString(),
    };
  }
}
