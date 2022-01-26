import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getAll(): Promise<any> {
    return await this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async create(@Req() request: IRequest): Promise<any> {
    return await this.service.create(request.body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async delete(@Req() request: IRequest): Promise<any> {
    return await this.service.deleteOne(request.params.id);
  }
}
