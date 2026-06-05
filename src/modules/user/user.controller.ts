import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
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
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async getUsers(): Promise<any> {
    return this.userService.findAll();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async getUser(@Param('id') id: string): Promise<any> {
    return this.userService.findOneById(id);
  }

  @Post()
  public async registerUser(@Body() body: any): Promise<any> {
    try {
      if (body.username && body.email && body.password) {
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
  public async updateUser(@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.userService.update(id, body);
  }

  @Put('/:id/role')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async updateUserRole(@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.userService.updateRole(id, body?.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async deleteUser(@Param('id') id: string): Promise<any> {
    return this.userService.deleteUser(id);
  }
}
