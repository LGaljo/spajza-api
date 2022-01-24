import { Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { InventoryItemsService } from './inventoryitem.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  public async getInventoryItems(@Req() request: IRequest): Promise<any> {
    const { params, query } = request;

    const limit = Number(params?.limit) || 15;
    const skip = Number(params?.skip) || 0;

    return await this.service.findAll(limit, skip, query?.category, query?.tags, query?.search);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  public async updateAll() {
    return await this.service.updateAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  public async getInventoryItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return await this.service.findOne(params?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  public async createInventoryItem(@Req() request: IRequest): Promise<any> {
    const { body } = request;
    return await this.service.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  public async updateItem(@Req() request: IRequest): Promise<any> {
    const { body, params } = request;
    return await this.service.updateOne(body, params.id);
  }
}
