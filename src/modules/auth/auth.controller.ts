import { BadRequestException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Role } from '../user/schemas/roles.enum';
import { UserService } from '../user/user.service';
import { generateChangePasswordUrl, JwtTokenType, parseToken } from '../../lib/jwt';
import * as bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { sendMail } from '../../lib/smtp';
import { MailTemplates } from '../../lib/mail-templates';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

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
    return req.context.user;
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

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: IRequest) {
    const { body, context } = req;
    if (!body?.old_pass || !body.new_pass) {
      throw new BadRequestException('Missing passwords');
    }
    if (!(await bcrypt.compare(body.old_pass, context.user.hash))) {
      return { success: false, reason: 'WRONG_OLD_PASS' };
    }
    await this.userService.changePassword(
      (req.context.user as any)._id.toHexString(),
      body.new_pass,
    );
    return { success: true };
  }

  @Post('request-password-change')
  async requestPasswordChange(@Req() req: IRequest) {
    const { body } = req;
    if (!body?.email) {
      throw new BadRequestException('Missing email parameter');
    }
    const user = await this.userService.findOneByUsernameOrEmail(body?.email);
    if (!user) {
      return { success: true }; // Not really haha
    }
    const data = {
      username: user.username,
      url: generateChangePasswordUrl((user as any)._id.toHexString(), user.email),
    };
    const template = MailTemplates.getTemplate('change-password');
    await sendMail({
      from: `Špajza <${env.MAIL_ADDRESS}>`,
      to: user.email,
      subject: 'Ponastavitev gesla',
      html: template(data),
    });
    // Send email with url/token to change pass
    console.log(body);
    return { success: true };
  }

  @Post('ext-change-password')
  async externalPasswordChange(@Req() req: IRequest) {
    const { body } = req;
    const data = parseToken(JwtTokenType.CHANGE_PASSWORD, body?.token);
    if (!data) {
      return { success: false };
    }
    if (!body.new_pass) {
      throw new BadRequestException('Missing passwords');
    }
    await this.userService.changePassword(data.userId, body.new_pass);
    return { success: true };
  }
}
