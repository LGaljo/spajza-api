import { BadRequestException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Role } from '../user/schemas/roles.enum';
import { UserService } from '../user/user.service';
import { JwtTokenType, parseToken } from '../../lib/jwt';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: IRequest) {
    const { user, body } = req;
    const login_res = { success: true, data: await this.authService.login(user, body?.saveme) };

    if (user?.role === Role.UNAPPROVED) {
      return {
        success: false,
        reason: Role.UNAPPROVED,
        userId: (user as any)?._id?.toHexString(),
      };
    }

    return login_res;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: IRequest) {
    return req.user;
  }

  @Post('resend-verification')
  async resendVerification(@Req() req: IRequest) {
    const { body } = req;
    if (!body?.userId) {
      throw new BadRequestException('Missing id');
    }
    return await this.userService.resendVerification(body?.userId);
  }

  @Post('verification')
  async accountVerification(@Req() req: IRequest) {
    const { body } = req;
    const data = parseToken(JwtTokenType.USER_CONFIRM_EMAIL, body?.token);
    if (!data) {
      return { success: false };
    }
    await this.userService.updateRole(data.userId, Role.USER);
    return { success: true };
  }
}
