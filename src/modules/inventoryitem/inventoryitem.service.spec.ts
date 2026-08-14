import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryItemsService } from './inventoryitem.service';
import { InventoryItem } from './schemas/inventoryitem.schema';
import { Category } from '../categories/schemas/category.schema';
import { Tag } from '../tags/schemas/tag.schema';
import { Trace } from '../tracing/schema/tracing.schema';
import { TracingService } from '../tracing/tracing.service';
import { CategoriesService } from '../categories/categories.service';
import { TagsService } from '../tags/tags.service';
import { CountersService } from '../counters/counters.service';
import { ObjectId } from 'mongodb';
import { Context } from '../../context';

// Mock sharp image processing
jest.mock('sharp', () => {
  const mSharp = jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock_image_buffer')),
  });
  return mSharp;
});

// Mock AWS S3 helper functions
jest.mock('../../lib/aws_s3', () => ({
  upload: jest.fn().mockResolvedValue({ key: 'mock_key', url: 'mock_url' }),
  remove: jest.fn().mockResolvedValue(true),
}));

describe('InventoryItemsService', () => {
  let service: InventoryItemsService;
  let tracingService: TracingService;
  let categoriesService: CategoriesService;
  let tagsService: TagsService;
  let countersService: CountersService;

  const mockItem = {
    _id: new ObjectId(),
    name: 'Camera',
    code: 101,
    cover: [{ key: 'cover_key' }],
    status: 'AVAILABLE',
  };

  // Setup queries
  const mockItemQuery = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockItemFindOneQuery = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockItemUpdateQuery = {
    exec: jest.fn().mockResolvedValue({ acknowledged: true }),
  };

  // Mock InventoryItem Model
  const mockInventoryItemModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new ObjectId(), ...dto }),
    };
  });

  (mockInventoryItemModel as any).find = jest.fn().mockReturnValue(mockItemQuery);
  (mockInventoryItemModel as any).findOne = jest.fn().mockReturnValue(mockItemFindOneQuery);
  (mockInventoryItemModel as any).updateOne = jest.fn().mockReturnValue(mockItemUpdateQuery);
  (mockInventoryItemModel as any).insertMany = jest.fn().mockImplementation((docs) => Promise.resolve(docs));

  // Mock Category Model query chain
  const mockCategoryQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const mockCategoryModel = {
    findOne: jest.fn().mockReturnValue(mockCategoryQuery),
    find: jest.fn().mockReturnValue(mockCategoryQuery),
  };

  // Mock Tag Model query chain
  const mockTagQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const mockTagModel = {
    find: jest.fn().mockReturnValue(mockTagQuery),
  };

  const mockTraceModel = {};

  // Mock Services
  const mockTracingService = {
    saveChange: jest.fn().mockResolvedValue(true),
  };

  const mockCategoriesService = {
    findOneById: jest.fn(),
  };

  const mockTagsService = {};

  const mockCountersService = {
    getLatestCode: jest.fn().mockResolvedValue(101),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryItemsService,
        {
          provide: getModelToken(InventoryItem.name),
          useValue: mockInventoryItemModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(Tag.name),
          useValue: mockTagModel,
        },
        {
          provide: getModelToken(Trace.name),
          useValue: mockTraceModel,
        },
        {
          provide: TracingService,
          useValue: mockTracingService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
        {
          provide: CountersService,
          useValue: mockCountersService,
        },
      ],
    }).compile();

    service = module.get<InventoryItemsService>(InventoryItemsService);
    tracingService = module.get<TracingService>(TracingService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    tagsService = module.get<TagsService>(TagsService);
    countersService = module.get<CountersService>(CountersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should resolve tagNames and categoryName and save item', async () => {
      const dto = {
        name: 'Item A',
        tagNames: ['Tag1'],
        categoryName: 'Category1',
      };

      const tagId = new ObjectId();
      mockTagQuery.exec.mockResolvedValue([{ _id: tagId, name: 'Tag1' }]);

      const catId = new ObjectId();
      mockCategoryQuery.exec.mockResolvedValue({ _id: catId, name: 'Category1' });

      mockCountersService.getLatestCode.mockResolvedValue(202);

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.code).toBe(202);
      expect(result.name).toBe('Item A');
      expect(result.tags).toEqual([tagId]);
      expect(result.category).toEqual(catId);
      expect(mockCountersService.getLatestCode).toHaveBeenCalledWith('items');
    });

    it('should map arrays of tags and categories as ObjectIds if provided directly', async () => {
      const tagId = new ObjectId().toHexString();
      const catId = new ObjectId().toHexString();
      const dto = {
        name: 'Item B',
        tags: [tagId],
        category: catId,
      };

      const result = await service.create(dto);

      expect(result.tags).toEqual([new ObjectId(tagId)]);
      expect(result.category).toEqual(new ObjectId(catId));
    });
  });

  describe('createMany', () => {
    it('should batch create items', async () => {
      const dtos = [
        { name: 'Item 1', tagNames: ['TagA'], categoryName: 'CatA' },
        { name: 'Item 2', tagNames: ['TagB'], categoryName: 'CatB' },
      ];

      const tag1 = { _id: new ObjectId(), name: 'TagA' };
      const tag2 = { _id: new ObjectId(), name: 'TagB' };
      const cat1 = { _id: new ObjectId(), name: 'CatA' };
      const cat2 = { _id: new ObjectId(), name: 'CatB' };

      mockTagQuery.exec.mockResolvedValue([tag1, tag2]);
      mockCategoryQuery.exec.mockResolvedValue([cat1, cat2]);
      mockCountersService.getLatestCode.mockResolvedValueOnce(301).mockResolvedValueOnce(302);

      const result = await service.createMany(dtos);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].tags).toEqual([tag1._id]);
      expect(result[1].tags).toEqual([tag2._id]);
      expect(result[0].category).toEqual(cat1._id);
      expect(result[1].category).toEqual(cat2._id);
    });

    it('should return empty array if no objects passed', async () => {
      const result = await service.createMany([]);
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should retrieve list of items with default search options', async () => {
      mockItemQuery.exec.mockResolvedValue([mockItem]);

      const result = await service.findAll();

      expect(result).toEqual([mockItem]);
      expect((mockInventoryItemModel as any).find).toHaveBeenCalledWith({ _deletedAt: null });
    });

    it('should apply filters for category, tags, renter, search etc', async () => {
      const catId = new ObjectId();
      const tagId = new ObjectId();
      const renterId = new ObjectId();

      mockItemQuery.exec.mockResolvedValue([mockItem]);

      await service.findAll(20, 5, 'name', 'desc', {
        category: catId.toHexString(),
        tags: tagId.toHexString(),
        renter: renterId.toHexString(),
        statuses: 'AVAILABLE',
        search: 'Camera',
      });

      expect((mockInventoryItemModel as any).find).toHaveBeenCalledWith({
        _deletedAt: null,
        category: { $in: [catId] },
        tags: { $in: [tagId] },
        'rents.renter': renterId,
        status: { $in: ['AVAILABLE'] },
        $text: { $search: 'Camera' },
      });
    });
  });

  describe('findOne', () => {
    it('should retrieve a single item', async () => {
      mockItemFindOneQuery.exec.mockResolvedValue(mockItem);

      const result = await service.findOne(mockItem._id.toHexString());

      expect(result).toEqual(mockItem);
      expect((mockInventoryItemModel as any).findOne).toHaveBeenCalledWith({
        _id: mockItem._id,
        _deletedAt: null,
      });
    });
  });

  describe('updateOne', () => {
    it('should log changes and update item', async () => {
      const itemId = new ObjectId();
      const objBefore = { _id: itemId, name: 'Old Name' };
      const updateDto = { name: 'New Name', categoryId: new ObjectId().toHexString() };
      const context: Context = { user: { _id: new ObjectId() } } as any;

      mockItemFindOneQuery.exec
        .mockResolvedValueOnce(objBefore) // First findOne to get objBefore
        .mockResolvedValueOnce({ _id: itemId, name: 'New Name' }); // second findOne when update completes

      const result = await service.updateOne(context, updateDto, itemId.toHexString());

      expect(mockTracingService.saveChange).toHaveBeenCalledWith(
        'inventoryitem',
        objBefore,
        expect.objectContaining({ name: 'New Name' }),
        context.user._id,
      );
      expect((mockInventoryItemModel as any).updateOne).toHaveBeenCalledWith(
        { _id: itemId },
        { $set: expect.objectContaining({ name: 'New Name' }) },
      );
      expect(result).toBeDefined();
    });
  });

  describe('deleteItem', () => {
    it('should delete cover image and soft delete item', async () => {
      const s3Helper = require('../../lib/aws_s3');
      const itemId = new ObjectId().toHexString();
      mockItemFindOneQuery.exec.mockResolvedValue({
        _id: itemId,
        cover: { key: 'cover_image_key' },
      });

      await service.deleteItem(itemId);

      expect(s3Helper.remove).toHaveBeenCalledWith('cover_image_key');
      expect((mockInventoryItemModel as any).updateOne).toHaveBeenCalledWith(
        { _id: itemId },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });
  });

  describe('findOverdueItems', () => {
    it('should retrieve overdue items', async () => {
      mockItemQuery.exec.mockResolvedValue([mockItem]);

      const result = await service.findOverdueItems();

      expect(result).toEqual([mockItem]);
      expect((mockInventoryItemModel as any).find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'BORROWED',
          'rents.returnTime': { $lt: expect.any(Date) },
        }),
      );
    });
  });
});
