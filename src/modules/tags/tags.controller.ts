import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { IRequest } from '../../middlewares/context.middleware';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { RolesGuard } from '../../guards/roles.guard';
import { ObjectId } from 'mongodb';

@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getAll(): Promise<any> {
    return await this.service.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getOne(@Req() request: IRequest): Promise<any> {
    return await this.service.findOneById(new ObjectId(request.params.id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async create(@Req() request: IRequest): Promise<any> {
    return await this.service.create(request.body);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async updateOne(@Req() request: IRequest): Promise<any> {
    return await this.service.updateOne(request.body, new ObjectId(request.params.id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async delete(@Req() request: IRequest): Promise<any> {
    return await this.service.deleteOne(request.params.id);
  }
}
