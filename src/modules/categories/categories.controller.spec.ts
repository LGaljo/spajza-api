import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ObjectId } from 'mongodb';
import { Role } from '../user/schemas/roles.enum';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    updateTemplateImage: jest.fn(),
    removeTemplateImage: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should call service.findAll with query parameters', async () => {
      const query = { url: 'true' };
      const expectedResult = [{ name: 'Electronics' }];
      mockCategoriesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.getAll(query);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getOne', () => {
    it('should call service.findOneById with a valid ObjectId', async () => {
      const idStr = new ObjectId().toHexString();
      const expectedResult = { _id: new ObjectId(idStr), name: 'Electronics' };
      mockCategoriesService.findOneById.mockResolvedValue(expectedResult);

      const result = await controller.getOne(idStr);

      expect(result).toEqual(expectedResult);
      expect(service.findOneById).toHaveBeenCalledWith(new ObjectId(idStr));
    });
  });

  describe('create', () => {
    it('should call service.create with payload', async () => {
      const payload = { name: 'Books' };
      const expectedResult = { _id: new ObjectId(), name: 'Books' };
      mockCategoriesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(payload);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateOne', () => {
    it('should call service.updateOne with payload and id', async () => {
      const id = new ObjectId().toHexString();
      const payload = { name: 'Books v2' };
      const expectedResult = { acknowledged: true };
      mockCategoriesService.updateOne.mockResolvedValue(expectedResult);

      const result = await controller.updateOne(id, payload);

      expect(result).toEqual(expectedResult);
      expect(service.updateOne).toHaveBeenCalledWith(payload, id);
    });
  });

  describe('updatePicture', () => {
    it('should call service.updateTemplateImage with file and id', async () => {
      const id = new ObjectId().toHexString();
      const file = { originalname: 'test.jpg' } as any;
      const expectedResult = { success: true };
      mockCategoriesService.updateTemplateImage.mockResolvedValue(expectedResult);

      const result = await controller.updatePicture(file, id);

      expect(result).toEqual(expectedResult);
      expect(service.updateTemplateImage).toHaveBeenCalledWith(file, id);
    });
  });

  describe('removePicture', () => {
    it('should call service.removeTemplateImage with id', async () => {
      const id = new ObjectId().toHexString();
      const expectedResult = { success: true };
      mockCategoriesService.removeTemplateImage.mockResolvedValue(expectedResult);

      const result = await controller.removePicture(null, id);

      expect(result).toEqual(expectedResult);
      expect(service.removeTemplateImage).toHaveBeenCalledWith(id);
    });
  });

  describe('delete', () => {
    it('should call service.deleteOne with id', async () => {
      const id = new ObjectId().toHexString();
      const expectedResult = { acknowledged: true };
      mockCategoriesService.deleteOne.mockResolvedValue(expectedResult);

      const result = await controller.delete(id);

      expect(result).toEqual(expectedResult);
      expect(service.deleteOne).toHaveBeenCalledWith(id);
    });
  });
});
