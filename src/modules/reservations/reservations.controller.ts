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
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async getReservations(): Promise<any> {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async createReservation(@Req() request: IRequest, @Body() body: any): Promise<any> {
    const { context } = request;
    return this.service.create(context, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async updateReservation(
    @Req() request: IRequest,
    @Body() body: any,
    @Param('id') id: string,
  ): Promise<any> {
    const { context } = request;
    return this.service.update(context, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async deleteReservation(@Req() request: IRequest, @Param('id') id: string): Promise<any> {
    const { context } = request;
    return this.service.remove(context, id);
  }
}
