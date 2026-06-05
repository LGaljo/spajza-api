import { Test, TestingModule } from '@nestjs/testing';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { ObjectId } from 'mongodb';
import { IRequest } from '../../middlewares/context.middleware';

describe('WishlistController', () => {
  let controller: WishlistController;
  let service: WishlistService;

  const mockWishlistService = {
    getItems: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        {
          provide: WishlistService,
          useValue: mockWishlistService,
        },
      ],
    }).compile();

    controller = module.get<WishlistController>(WishlistController);
    service = module.get<WishlistService>(WishlistService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getItems', () => {
    it('should return wishlist items', async () => {
      const expectedResult = [{ name: 'Hammer' }];
      mockWishlistService.getItems.mockResolvedValue(expectedResult);

      const result = await controller.getItems();

      expect(result).toEqual(expectedResult);
      expect(service.getItems).toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    it('should pass context and body to service.createItem', async () => {
      const mockRequest = {
        context: { user: { _id: new ObjectId(), username: 'tester' } },
      } as unknown as IRequest;
      const body = { name: 'Hammer' };
      const expectedResult = { _id: new ObjectId(), ...body, user: mockRequest.context.user._id };
      mockWishlistService.createItem.mockResolvedValue(expectedResult);

      const result = await controller.createItem(mockRequest, body);

      expect(result).toEqual(expectedResult);
      expect(service.createItem).toHaveBeenCalledWith(mockRequest.context, body);
    });
  });

  describe('updateItem', () => {
    it('should call service.updateItem with context, id and body', async () => {
      const mockRequest = {
        context: { user: { _id: new ObjectId(), username: 'tester', role: 'USER' } },
      } as unknown as IRequest;
      const id = new ObjectId().toHexString();
      const body = { name: 'Better Hammer' };
      const expectedResult = { acknowledged: true };
      mockWishlistService.updateItem.mockResolvedValue(expectedResult);

      const result = await controller.updateItem(mockRequest, body, id);

      expect(result).toEqual(expectedResult);
      expect(service.updateItem).toHaveBeenCalledWith(mockRequest.context, id, body);
    });
  });

  describe('deleteItem', () => {
    it('should call service.removeItem with context and id', async () => {
      const mockRequest = {
        context: { user: { _id: new ObjectId(), username: 'tester', role: 'USER' } },
      } as unknown as IRequest;
      const id = new ObjectId().toHexString();
      const expectedResult = { acknowledged: true };
      mockWishlistService.removeItem.mockResolvedValue(expectedResult);

      const result = await controller.deleteItem(mockRequest, id);

      expect(result).toEqual(expectedResult);
      expect(service.removeItem).toHaveBeenCalledWith(mockRequest.context, id);
    });
  });
});
