import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';
import { InventoryItem } from '../inventoryitem/schemas/inventoryitem.schema';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategory = {
    _id: new ObjectId(),
    name: 'Electronics',
    templateImage: { Key: 'key' },
  };

  const mockCategoryQuery = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockCategoryFindOneQuery = {
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockCategoryUpdateQuery = {
    exec: jest.fn().mockResolvedValue({ acknowledged: true }),
  };

  const mockCategoryCountQuery = {
    countDocuments: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockCategoryModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new ObjectId(), ...dto }),
    };
  });

  (mockCategoryModel as any).find = jest.fn().mockReturnValue(mockCategoryQuery);
  (mockCategoryModel as any).findOne = jest.fn().mockReturnValue(mockCategoryFindOneQuery);
  (mockCategoryModel as any).updateOne = jest.fn().mockReturnValue(mockCategoryUpdateQuery);

  const mockItemModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(InventoryItem.name),
          useValue: mockItemModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'New Category' };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('New Category');
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      mockCategoryQuery.exec.mockResolvedValue([mockCategory]);
      const result = await service.findAll({});
      expect(result).toEqual([mockCategory]);
      expect((mockCategoryModel as any).find).toHaveBeenCalledWith({ _deletedAt: null });
    });

    it('should filter categories if url is passed', async () => {
      mockCategoryQuery.exec.mockResolvedValue([mockCategory]);
      await service.findAll({ url: true });
      expect((mockCategoryModel as any).find).toHaveBeenCalledWith({
        _deletedAt: null,
        url: { $ne: null },
      });
    });
  });

  describe('findOneById', () => {
    it('should return a category if found', async () => {
      mockCategoryFindOneQuery.exec.mockResolvedValue(mockCategory);
      const result = await service.findOneById(mockCategory._id);
      expect(result).toEqual(mockCategory);
    });

    it('should throw BadRequestException if not found', async () => {
      mockCategoryFindOneQuery.exec.mockResolvedValue(null);
      await expect(service.findOneById(new ObjectId())).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneByName', () => {
    it('should return a category by name', async () => {
      mockCategoryFindOneQuery.exec.mockResolvedValue(mockCategory);
      const result = await service.findOneByName('Electronics');
      expect(result).toEqual(mockCategory);
      expect((mockCategoryModel as any).findOne).toHaveBeenCalledWith({
        name: 'Electronics',
        _deletedAt: null,
      });
    });
  });

  describe('updateOne', () => {
    it('should update a category', async () => {
      const id = new ObjectId().toHexString();
      const body = { name: 'Updated name' };
      const result = await service.updateOne(body, id);
      expect(result).toEqual({ acknowledged: true });
      expect((mockCategoryModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id), _deletedAt: null },
        { $set: body },
      );
    });
  });

  describe('deleteOne', () => {
    it('should soft delete a category if there are no items', async () => {
      const id = new ObjectId().toHexString();
      (mockCategoryModel as any).find.mockReturnValueOnce({
        countDocuments: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.deleteOne(id);

      expect((mockCategoryModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id) },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });

    it('should throw BadRequestException if items exist in category', async () => {
      const id = new ObjectId().toHexString();
      (mockCategoryModel as any).find.mockReturnValueOnce({
        countDocuments: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(1),
      });

      await expect(service.deleteOne(id)).rejects.toThrow(BadRequestException);
    });
  });
});
