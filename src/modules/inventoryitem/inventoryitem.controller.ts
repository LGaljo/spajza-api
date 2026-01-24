import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
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
  public async getInventoryItems(@Query() query: any): Promise<any> {
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
  public async getInventoryItem(@Param('id') id: string): Promise<any> {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async createInventoryItem(@Body() body: any): Promise<any> {
    return this.service.create(body);
  }

  @Post('multi')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async createMultipleInventoryItems(@Body() body: any): Promise<any> {
    if (!body.length) {
      throw new BadRequestException('Empty body');
    }
    return this.service.createMany(body);
  }

  @Post('file/:id')
  @UseInterceptors(FileInterceptor('file'))
  public async addCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.service.addCoverImage(file, id);
  }

  @Delete('file/:id')
  public async removeCoverImage(@Param('id') id: string, @Query() query: any) {
    return this.service.removeCoverImage(query.key, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async updateItem(
    @Req() request: IRequest,
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    const { context } = request;
    return this.service.updateOne(context, body, id);
  }

  // TODO: Add different update method for modifying only specific fields

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KEEPER)
  public async deleteItem(@Param('id') id: string): Promise<any> {
    return this.service.deleteItem(id);
  }
}
