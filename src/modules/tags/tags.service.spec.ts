import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TagsService } from './tags.service';
import { Tag } from './schemas/tag.schema';
import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

describe('TagsService', () => {
  let service: TagsService;

  const mockTag = {
    _id: new ObjectId(),
    name: 'Fragile',
  };

  const mockTagQuery = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockTagFindOneQuery = {
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockTagUpdateQuery = {
    exec: jest.fn().mockResolvedValue({ acknowledged: true }),
  };

  const mockTagModel = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new ObjectId(), ...dto }),
    };
  });

  (mockTagModel as any).find = jest.fn().mockReturnValue(mockTagQuery);
  (mockTagModel as any).findOne = jest.fn().mockReturnValue(mockTagFindOneQuery);
  (mockTagModel as any).updateOne = jest.fn().mockReturnValue(mockTagUpdateQuery);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getModelToken(Tag.name),
          useValue: mockTagModel,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tag', async () => {
      const dto = { name: 'Fragile' };
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Fragile');
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      mockTagQuery.exec.mockResolvedValue([mockTag]);
      const result = await service.findAll();
      expect(result).toEqual([mockTag]);
      expect((mockTagModel as any).find).toHaveBeenCalledWith({ _deletedAt: null });
    });
  });

  describe('findOneById', () => {
    it('should return a tag if found', async () => {
      mockTagFindOneQuery.exec.mockResolvedValue(mockTag);
      const result = await service.findOneById(mockTag._id);
      expect(result).toEqual(mockTag);
    });
  });

  describe('findOneByName', () => {
    it('should return a tag by name', async () => {
      mockTagFindOneQuery.exec.mockResolvedValue(mockTag);
      const result = await service.findOneByName('Fragile');
      expect(result).toEqual(mockTag);
      expect((mockTagModel as any).findOne).toHaveBeenCalledWith({
        name: 'Fragile',
        _deletedAt: null,
      });
    });
  });

  describe('updateOne', () => {
    it('should update a tag', async () => {
      const id = new ObjectId();
      const body = { name: 'Updated tag' };
      const result = await service.updateOne(body, id);
      expect(result).toEqual({ acknowledged: true });
      expect((mockTagModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id), _deletedAt: null },
        { $set: body },
      );
    });
  });

  describe('deleteOne', () => {
    it('should soft delete a tag if there are no items associated', async () => {
      const id = new ObjectId().toHexString();
      (mockTagModel as any).find.mockReturnValueOnce({
        countDocuments: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.deleteOne(id);

      expect((mockTagModel as any).updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id) },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });

    it('should throw BadRequestException if items are still connected', async () => {
      const id = new ObjectId().toHexString();
      (mockTagModel as any).find.mockReturnValueOnce({
        countDocuments: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(1),
      });

      await expect(service.deleteOne(id)).rejects.toThrow(BadRequestException);
    });
  });
});
