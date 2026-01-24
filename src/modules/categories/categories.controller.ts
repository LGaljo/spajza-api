import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { Role } from '../user/schemas/roles.enum';
import { ObjectId } from 'mongodb';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getAll(@Query() query: any): Promise<any> {
    return await this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER, Role.KEEPER)
  public async getOne(@Param('id', ParseIntPipe) id: string): Promise<any> {
    return await this.service.findOneById(new ObjectId(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async create(@Body() body: any): Promise<any> {
    return await this.service.create(body);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async updateOne(@Param('id', ParseIntPipe) id: string, @Body() body: any): Promise<any> {
    return await this.service.updateOne(body, id);
  }

  @Post('file/:id')
  @UseInterceptors(FileInterceptor('file'))
  public async updatePicture(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.service.updateTemplateImage(file, id);
  }

  @Post('remove_file/:id')
  @UseInterceptors(FileInterceptor('file'))
  public async removePicture(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.service.removeTemplateImage(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  public async delete(@Param('id', ParseIntPipe) id: string): Promise<any> {
    return await this.service.deleteOne(id);
  }
}
