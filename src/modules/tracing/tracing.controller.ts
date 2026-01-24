import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { TracingService } from './tracing.service';

@Controller('tracing')
export class TracingController {
  constructor(private readonly service: TracingService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  async getChangesForItem(@Param('id') id: string): Promise<any> {
    return await this.service.getChangesForObject(id);
  }
}
