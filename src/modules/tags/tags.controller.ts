import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
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
  public async getOne(@Param('id') id: string): Promise<any> {
    return await this.service.findOneById(new ObjectId(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async create(@Body() body: any): Promise<any> {
    return await this.service.create(body);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async updateOne(@Param('id') id: string, @Body() body: any): Promise<any> {
    return await this.service.updateOne(body, new ObjectId(id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async delete(@Param('id') id: string): Promise<any> {
    return await this.service.deleteOne(id);
  }
}
