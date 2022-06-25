import { BadRequestException, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from './schemas/roles.enum';
import { RolesGuard } from '../../guards/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  public async getUsers(@Req() _request: IRequest): Promise<any> {
    return this.userService.findAll();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  public async getUser(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return this.userService.findOneById(params.id);
  }

  @Post()
  public async registerUser(@Req() request: IRequest): Promise<any> {
    const { body } = request;

    try {
      if (
        body.hasOwnProperty('username') &&
        body.hasOwnProperty('email') &&
        body.hasOwnProperty('password') &&
        body.hasOwnProperty('username')
      ) {
        delete body.role;
        return {
          user: await this.userService.create(body),
          success: true,
        };
      }
    } catch (err) {
      console.log(err);
      if (err?.code === 11000) {
        return {
          success: false,
          code: err?.code,
          key: err?.keyValue,
        };
      }
    }

    throw new BadRequestException('Missing user fields');
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async updateUser(@Req() request: IRequest): Promise<any> {
    const { body, params } = request;

    return this.userService.update(params.id, body);
  }

  @Put('/:id/role')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async updateUserRole(@Req() request: IRequest): Promise<any> {
    const { body, params } = request;

    return this.userService.updateRole(params.id, body?.role);
  }
}
