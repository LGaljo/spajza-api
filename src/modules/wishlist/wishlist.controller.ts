import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../guards/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { IRequest } from '../../middlewares/context.middleware';
import { Role } from '../user/schemas/roles.enum';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
  constructor(private service: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async getItems(): Promise<any> {
    return this.service.getItems();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async createItem(@Req() request: IRequest, @Body() body: any): Promise<any> {
    const { context } = request;
    return this.service.createItem(context, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async updateItem(
    @Req() request: IRequest,
    @Body() body: any,
    @Param('id') id: string,
  ): Promise<any> {
    const { context } = request;
    return this.service.updateItem(context, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async deleteItem(@Req() request: IRequest, @Param('id') id: string): Promise<any> {
    const { context } = request;
    return this.service.removeItem(context, id);
  }
}
