import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './wishlist.schema';
import { ObjectId } from 'mongodb';
import { Context } from '../../context';

describe('WishlistService', () => {
  let service: WishlistService;

  const mockWishlistItem = {
    _id: new ObjectId(),
    name: '3D Printer',
    user: new ObjectId(),
  };

  const mockWishlistQuery = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockWishlistUpdateQuery = {
    exec: jest.fn().mockResolvedValue({ acknowledged: true }),
  };

  const mockWishlistModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new ObjectId(), ...dto }),
    };
  });

  (mockWishlistModel as any).find = jest.fn().mockReturnValue(mockWishlistQuery);
  (mockWishlistModel as any).updateOne = jest.fn().mockReturnValue(mockWishlistUpdateQuery);
  (mockWishlistModel as any).findOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: mockWishlistModel,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createItem', () => {
    it('should create an item and associate with context user', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;
      const body = { name: 'Screwdriver Set' };

      const result = await service.createItem(mockContext, body);

      expect(result).toBeDefined();
      expect(result.user).toEqual(mockContext.user._id);
    });
  });

  describe('updateItem', () => {
    it('should update a wishlist item if user is the owner', async () => {
      const id = new ObjectId().toHexString();
      const body = { name: 'Better Screwdriver Set' };
      const userId = new ObjectId();
      const mockContext: Context = {
        user: { _id: userId, username: 'tester', role: 'USER' },
      } as any;

      (mockWishlistModel as any).findOne.mockResolvedValue({
        _id: new ObjectId(id),
        user: userId,
      });

      const result = await service.updateItem(mockContext, id, body);

      expect(result).toEqual({ acknowledged: true });
      expect((mockWishlistModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id) },
        { $set: body },
      );
    });

    it('should update a wishlist item if user is ADMIN', async () => {
      const id = new ObjectId().toHexString();
      const body = { name: 'Better Screwdriver Set' };
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'admin', role: 'ADMIN' },
      } as any;

      (mockWishlistModel as any).findOne.mockResolvedValue({
        _id: new ObjectId(id),
        user: new ObjectId(),
      });

      const result = await service.updateItem(mockContext, id, body);

      expect(result).toEqual({ acknowledged: true });
    });

    it('should throw ForbiddenException if user is not the owner and not admin/keeper', async () => {
      const id = new ObjectId().toHexString();
      const body = { name: 'Better Screwdriver Set' };
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;

      (mockWishlistModel as any).findOne.mockResolvedValue({
        _id: new ObjectId(id),
        user: new ObjectId(),
      });

      await expect(service.updateItem(mockContext, id, body)).rejects.toThrow();
    });
  });

  describe('getItems', () => {
    it('should return non-deleted wishlist items sorted by order', async () => {
      mockWishlistQuery.exec.mockResolvedValue([mockWishlistItem]);

      const result = await service.getItems();

      expect(result).toEqual([mockWishlistItem]);
      expect((mockWishlistModel as any).find).toHaveBeenCalledWith({ _deletedAt: null });
    });
  });

  describe('removeItem', () => {
    it('should mark an item as deleted if user is the owner', async () => {
      const id = new ObjectId().toHexString();
      const userId = new ObjectId();
      const mockContext: Context = {
        user: { _id: userId, username: 'tester', role: 'USER' },
      } as any;

      (mockWishlistModel as any).findOne.mockResolvedValue({
        _id: new ObjectId(id),
        user: userId,
      });

      await service.removeItem(mockContext, id);

      expect((mockWishlistModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id) },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });

    it('should throw ForbiddenException if user is not the owner and not admin/keeper', async () => {
      const id = new ObjectId().toHexString();
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;

      (mockWishlistModel as any).findOne.mockResolvedValue({
        _id: new ObjectId(id),
        user: new ObjectId(),
      });

      await expect(service.removeItem(mockContext, id)).rejects.toThrow();
    });
  });
});
