import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IRequest } from '../../middlewares/context.middleware';
import { InventoryItemsService } from './inventoryitem.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('inventory')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getInventoryItems(@Req() request: IRequest): Promise<any> {
    const { query } = request;

    const limit = Number(query?.limit) || 15;
    const skip = Number(query?.skip) || 0;
    const sort = query?.sort;
    const dir = query?.sort_dir;

    return this.service.findAll(limit, skip, sort, dir, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getInventoryItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return this.service.findOne(params?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async createInventoryItem(@Req() request: IRequest): Promise<any> {
    const { body } = request;
    return this.service.create(body);
  }

  @Post('multi')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async createMultipleInventoryItems(@Req() request: IRequest): Promise<any> {
    const { body } = request;
    if (!body.length) {
      throw new BadRequestException('Empty body');
    }
    for (const item of body) {
      await this.service.create(item);
    }
  }

  @Post('file/:id')
  @UseInterceptors(FileInterceptor('file'))
  public async updatePicture(@UploadedFile() file: Express.Multer.File, @Req() request: IRequest) {
    const { params } = request;
    return this.service.updateCoverImage(file, params.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async updateItem(@Req() request: IRequest): Promise<any> {
    const { body, params, context } = request;
    return this.service.updateOne(context, body, params.id);
  }

  // TODO: Add different update method for modifying only specific fields

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async deleteItem(@Req() request: IRequest): Promise<any> {
    const { params } = request;
    return this.service.deleteItem(params.id);
  }
}
