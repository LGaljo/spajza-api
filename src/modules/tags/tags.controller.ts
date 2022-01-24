import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { IRequest } from '../../middlewares/context.middleware';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  public async getAll(@Req() request: IRequest): Promise<any> {
    return await this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  public async create(@Req() request: IRequest): Promise<any> {
    return await this.service.create(request.body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  public async delete(@Req() request: IRequest): Promise<any> {
    return await this.service.deleteOne(request.params.id);
  }
}
