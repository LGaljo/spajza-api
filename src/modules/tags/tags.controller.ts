import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { TagsService } from './tags.service';
import { IRequest } from '../../middlewares/context.middleware';

@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  public async getAll(@Req() request: IRequest): Promise<any> {
    return await this.service.findAll();
  }

  @Post()
  public async create(@Req() request: IRequest): Promise<any> {
    return await this.service.create(request.body);
  }

  @Delete(':id')
  public async delete(@Req() request: IRequest): Promise<any> {
    return await this.service.deleteOne(request.params.id);
  }
}
