import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsController } from './inventoryitem.controller';
import { InventoryItemsService } from './inventoryitem.service';
import { ObjectId } from 'mongodb';

describe('InventoryItemsController', () => {
  let controller: InventoryItemsController;
  let service: InventoryItemsService;

  const mockInventoryItemsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    addCoverImage: jest.fn(),
    removeCoverImage: jest.fn(),
    updateOne: jest.fn(),
    deleteItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemsController],
      providers: [
        {
          provide: InventoryItemsService,
          useValue: mockInventoryItemsService,
        },
      ],
    }).compile();

    controller = module.get<InventoryItemsController>(InventoryItemsController);
    service = module.get<InventoryItemsService>(InventoryItemsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInventoryItems', () => {
    it('should call service.findAll with query parameters', async () => {
      const query = { limit: '5', skip: '10', sort: 'name', sort_dir: 'desc' };
      const expectedResult = { data: [{ name: 'Item A' }], total: 1 };
      mockInventoryItemsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.getInventoryItems(query);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(5, 10, 'name', 'desc', query);
    });

    it('should fall back to defaults if query fields are empty', async () => {
      mockInventoryItemsService.findAll.mockResolvedValue([]);
      await controller.getInventoryItems({});
      expect(service.findAll).toHaveBeenCalledWith(15, 0, undefined, undefined, {});
    });
  });

  describe('getInventoryItem', () => {
    it('should retrieve single item by ID string', async () => {
      const id = new ObjectId().toHexString();
      const expectedItem = { _id: id, name: 'Sample Item' };
      mockInventoryItemsService.findOne.mockResolvedValue(expectedItem);

      const result = await controller.getInventoryItem(id);

      expect(result).toEqual(expectedItem);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('createInventoryItem', () => {
    it('should call service.create with payload', async () => {
      const body = { name: 'Bread' };
      const expectedResult = { _id: new ObjectId(), ...body };
      mockInventoryItemsService.create.mockResolvedValue(expectedResult);

      const result = await controller.createInventoryItem(body);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(body);
    });
  });

  describe('createMultipleInventoryItems', () => {
    it('should call service.createMany with multiple items', async () => {
      const body = [{ name: 'Milk' }, { name: 'Honey' }];
      const expectedResult = [{ _id: new ObjectId(), name: 'Milk' }];
      mockInventoryItemsService.createMany.mockResolvedValue(expectedResult);

      const result = await controller.createMultipleInventoryItems(body);

      expect(result).toEqual(expectedResult);
      expect(service.createMany).toHaveBeenCalledWith(body);
    });

    it('should throw BadRequestException if array is empty', async () => {
      await expect(controller.createMultipleInventoryItems([])).rejects.toThrow();
    });
  });

  describe('addCoverImage', () => {
    it('should call service.addCoverImage', async () => {
      const id = new ObjectId().toHexString();
      const mockFile = { originalname: 'file.png' } as any;
      mockInventoryItemsService.addCoverImage.mockResolvedValue({ success: true });

      const result = await controller.addCoverImage(mockFile, id);

      expect(result).toEqual({ success: true });
      expect(service.addCoverImage).toHaveBeenCalledWith(mockFile, id);
    });
  });

  describe('removeCoverImage', () => {
    it('should call service.removeCoverImage', async () => {
      const id = new ObjectId().toHexString();
      const query = { key: 'aws_key' };
      mockInventoryItemsService.removeCoverImage.mockResolvedValue({ success: true });

      const result = await controller.removeCoverImage(id, query);

      expect(result).toEqual({ success: true });
      expect(service.removeCoverImage).toHaveBeenCalledWith('aws_key', id);
    });
  });

  describe('updateItem', () => {
    it('should call service.updateOne with context, id, and body', async () => {
      const id = new ObjectId().toHexString();
      const mockContext = { user: { _id: 'some_user' } };
      const req = { context: mockContext } as any;
      const body = { name: 'Salt' };

      mockInventoryItemsService.updateOne.mockResolvedValue({ _id: id, name: 'Salt' });

      const result = await controller.updateItem(req, id, body);

      expect(result).toEqual({ _id: id, name: 'Salt' });
      expect(service.updateOne).toHaveBeenCalledWith(mockContext, body, id);
    });
  });

  describe('deleteItem', () => {
    it('should call service.deleteItem with item ID', async () => {
      const id = new ObjectId().toHexString();
      mockInventoryItemsService.deleteItem.mockResolvedValue({ success: true });

      const result = await controller.deleteItem(id);

      expect(result).toEqual({ success: true });
      expect(service.deleteItem).toHaveBeenCalledWith(id);
    });
  });
});
