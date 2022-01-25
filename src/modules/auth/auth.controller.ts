import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: IRequest) {
    return this.authService.login(req.user, req.context);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: IRequest) {
    return req.user;
  }
}
