import { BadRequestException, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  public async getUsers(@Req() _request: IRequest): Promise<any> {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getUser(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return this.userService.findOneById(params.id);
  }

  @Post()
  public async registerUser(@Req() request: IRequest): Promise<any> {
    const { body } = request;

    if (
      body.hasOwnProperty('username') &&
      body.hasOwnProperty('email') &&
      body.hasOwnProperty('password') &&
      body.hasOwnProperty('username')
    ) {
      delete body.role;
      return this.userService.create(body);
    }

    throw new BadRequestException('Missing user fields');
  }
}
