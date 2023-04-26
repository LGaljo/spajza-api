import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { IRequest } from '../../middlewares/context.middleware';

@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getItemsComments(@Req() request: IRequest): Promise<any> {
    const { query } = request;

    return this.service.getCommentsForItem(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
  public async createInventoryItem(@Req() request: IRequest): Promise<any> {
    const { body, context } = request;
    return this.service.create(body, context);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async deleteItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return this.service.delete(params.id);
  }
}
