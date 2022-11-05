import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../guards/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { IRequest } from '../../middlewares/context.middleware';
import { Role } from '../user/schemas/roles.enum';
import { RentsService } from './rents.service';

@Controller('rents')
export class RentsController {
  constructor(private readonly service: RentsService) {}

  @Post('borrow/:id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async createInventoryItem(@Req() request: IRequest): Promise<any> {
    const { context, body, params } = request;
    return this.service.rentItem(context, params.id, body);
  }

  @Post('return/:id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async returnInventoryItem(@Req() request: IRequest): Promise<any> {
    const { context, params } = request;
    return this.service.returnItem(context, params.id);
  }
}
