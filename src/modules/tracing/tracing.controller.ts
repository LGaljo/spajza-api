import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { TracingService } from './tracing.service';
import { IRequest } from '../../middlewares/context.middleware';

@Controller('tracing')
export class TracingController {
  constructor(private readonly service: TracingService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  async getChangesForItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return await this.service.getChangesForObject(params.id);
  }
}
