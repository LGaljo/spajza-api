import { Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/guards/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { IRequest } from 'src/middlewares/context.middleware';
import { Role } from '../user/schemas/roles.enum';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
export class WishlistController {
    constructor(private service: WishlistService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
    public async getItems(@Req() request: IRequest): Promise<any> {
        const { context } = request;
        return this.service.getItems(context);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
    public async createItem(@Req() request: IRequest): Promise<any> {
        const { context, body } = request;
        return this.service.createItem(context, body);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
    public async updateItem(@Req() request: IRequest): Promise<any> {
        const { context, body, params } = request;
        return this.service.updateItem(context, Number(params.id), body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.KEEPER, Role.USER)
    public async deleteItem(@Req() request: IRequest): Promise<any> {
        const { context, params } = request;
        return this.service.removeItem(context, Number(params.id));
    }
}
