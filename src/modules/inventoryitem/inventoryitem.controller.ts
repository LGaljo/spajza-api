import { Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { InventoryItemsService } from './inventoryitem.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';

@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getInventoryItems(@Req() request: IRequest): Promise<any> {
    const { params, query } = request;

    const limit = Number(params?.limit) || 15;
    const skip = Number(params?.skip) || 0;

    return await this.service.findAll(limit, skip, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getInventoryItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return await this.service.findOne(params?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async createInventoryItem(@Req() request: IRequest): Promise<any> {
    const { body } = request;
    return await this.service.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async updateItem(@Req() request: IRequest): Promise<any> {
    const { body, params, context } = request;
    return await this.service.updateOne(context, body, params.id);
  }

  // TODO: Add different update method for modifying only specific fields

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async deleteItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return await this.service.deleteItem(params.id);
  }
}
