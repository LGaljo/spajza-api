import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { ObjectId } from 'mongodb';

describe('TagsController', () => {
  let controller: TagsController;
  let service: TagsService;

  const mockTagsService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
    service = module.get<TagsService>(TagsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should call service.findAll and return tags', async () => {
      const expectedResult = [{ name: 'Fragile' }];
      mockTagsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.getAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('should call service.findOneById with ObjectId', async () => {
      const idStr = new ObjectId().toHexString();
      const expectedResult = { _id: new ObjectId(idStr), name: 'Fragile' };
      mockTagsService.findOneById.mockResolvedValue(expectedResult);

      const result = await controller.getOne(idStr);

      expect(result).toEqual(expectedResult);
      expect(service.findOneById).toHaveBeenCalledWith(new ObjectId(idStr));
    });
  });

  describe('create', () => {
    it('should call service.create with payload', async () => {
      const payload = { name: 'New Tag' };
      const expectedResult = { _id: new ObjectId(), name: 'New Tag' };
      mockTagsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(payload);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateOne', () => {
    it('should call service.updateOne with payload and ObjectId', async () => {
      const idStr = new ObjectId().toHexString();
      const payload = { name: 'Updated Tag' };
      const expectedResult = { acknowledged: true };
      mockTagsService.updateOne.mockResolvedValue(expectedResult);

      const result = await controller.updateOne(idStr, payload);

      expect(result).toEqual(expectedResult);
      expect(service.updateOne).toHaveBeenCalledWith(payload, new ObjectId(idStr));
    });
  });

  describe('delete', () => {
    it('should call service.deleteOne with id', async () => {
      const idStr = new ObjectId().toHexString();
      const expectedResult = { acknowledged: true };
      mockTagsService.deleteOne.mockResolvedValue(expectedResult);

      const result = await controller.delete(idStr);

      expect(result).toEqual(expectedResult);
      expect(service.deleteOne).toHaveBeenCalledWith(idStr);
    });
  });
});
