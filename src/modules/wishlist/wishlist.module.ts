import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { Wishlist, WishlistSchema } from './wishlist.schema';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService]
})
export class WishlistModule {}
