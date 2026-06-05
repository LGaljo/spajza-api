import { Test, TestingModule } from '@nestjs/testing';
import { RentsService } from './rents.service';
import { InventoryItemsService } from '../inventoryitem/inventoryitem.service';
import { ObjectId } from 'mongodb';
import { Context } from '../../context';
import { ItemStatus } from '../inventoryitem/schemas/itemstatus.enum';
import { Role } from '../user/schemas/roles.enum';
import { ForbiddenException } from '@nestjs/common';

describe('RentsService', () => {
  let service: RentsService;
  let itemsService: jest.Mocked<InventoryItemsService>;

  const mockInventoryItemsService = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentsService,
        {
          provide: InventoryItemsService,
          useValue: mockInventoryItemsService,
        },
      ],
    }).compile();

    service = module.get<RentsService>(RentsService);
    itemsService = module.get(InventoryItemsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rentItem', () => {
    it('should rent an item successfully', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: Role.USER },
      } as any;
      const itemId = new ObjectId().toHexString();
      const returnTime = new Date();
      const subject = 'Testing';

      const mockItem = {
        _id: itemId,
        status: ItemStatus.STORED,
        rents: null,
      };

      mockInventoryItemsService.findOne.mockResolvedValueOnce(mockItem);
      mockInventoryItemsService.findOne.mockResolvedValueOnce({
        ...mockItem,
        status: ItemStatus.BORROWED,
        rents: {
          borrowedAt: expect.any(Date),
          returnTime,
          renter: mockContext.user._id,
          subject,
        },
      });

      const result = await service.rentItem(mockContext, itemId, { returnTime, subject });

      expect(result).toBeDefined();
      expect(result.status).toEqual(ItemStatus.BORROWED);
      expect(mockInventoryItemsService.updateOne).toHaveBeenCalledWith(
        mockContext,
        expect.objectContaining({ status: ItemStatus.BORROWED }),
        itemId,
      );
    });
  });

  describe('returnItem', () => {
    it('should return item successfully if user is the renter', async () => {
      const userId = new ObjectId();
      const mockContext: Context = {
        user: { _id: userId, username: 'tester', role: Role.USER },
      } as any;
      const itemId = new ObjectId().toHexString();

      const mockItem = {
        _id: itemId,
        status: ItemStatus.BORROWED,
        rents: {
          borrowedAt: new Date(),
          returnTime: new Date(),
          renter: userId,
          subject: 'Borrowing',
        },
      };

      mockInventoryItemsService.findOne.mockResolvedValueOnce(mockItem);
      mockInventoryItemsService.findOne.mockResolvedValueOnce({
        ...mockItem,
        status: ItemStatus.STORED,
        rents: null,
      });

      const result = await service.returnItem(mockContext, itemId);

      expect(result.status).toEqual(ItemStatus.STORED);
      expect(result.rents).toBeNull();
      expect(mockInventoryItemsService.updateOne).toHaveBeenCalled();
    });

    it('should return item successfully if user is ADMIN but not the renter', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'admin', role: Role.ADMIN },
      } as any;
      const itemId = new ObjectId().toHexString();

      const mockItem = {
        _id: itemId,
        status: ItemStatus.BORROWED,
        rents: {
          borrowedAt: new Date(),
          returnTime: new Date(),
          renter: new ObjectId(),
          subject: 'Borrowing',
        },
      };

      mockInventoryItemsService.findOne.mockResolvedValueOnce(mockItem);
      mockInventoryItemsService.findOne.mockResolvedValueOnce({
        ...mockItem,
        status: ItemStatus.STORED,
        rents: null,
      });

      const result = await service.returnItem(mockContext, itemId);
      expect(result.status).toEqual(ItemStatus.STORED);
    });

    it('should return item successfully if user is KEEPER but not the renter', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'keeper', role: Role.KEEPER },
      } as any;
      const itemId = new ObjectId().toHexString();

      const mockItem = {
        _id: itemId,
        status: ItemStatus.BORROWED,
        rents: {
          borrowedAt: new Date(),
          returnTime: new Date(),
          renter: new ObjectId(),
          subject: 'Borrowing',
        },
      };

      mockInventoryItemsService.findOne.mockResolvedValueOnce(mockItem);
      mockInventoryItemsService.findOne.mockResolvedValueOnce({
        ...mockItem,
        status: ItemStatus.STORED,
        rents: null,
      });

      const result = await service.returnItem(mockContext, itemId);
      expect(result.status).toEqual(ItemStatus.STORED);
    });

    it('should throw ForbiddenException if user is USER and not the renter', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'other', role: Role.USER },
      } as any;
      const itemId = new ObjectId().toHexString();

      const mockItem = {
        _id: itemId,
        status: ItemStatus.BORROWED,
        rents: {
          borrowedAt: new Date(),
          returnTime: new Date(),
          renter: new ObjectId(),
          subject: 'Borrowing',
        },
      };

      mockInventoryItemsService.findOne.mockResolvedValueOnce(mockItem);

      await expect(service.returnItem(mockContext, itemId)).rejects.toThrow(ForbiddenException);
    });
  });
});
