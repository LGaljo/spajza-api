import { Test, TestingModule } from '@nestjs/testing';
import { RentsController } from './rents.controller';
import { RentsService } from './rents.service';
import { ObjectId } from 'mongodb';

describe('RentsController', () => {
  let controller: RentsController;
  let service: RentsService;

  const mockRentsService = {
    rentItem: jest.fn(),
    returnItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentsController],
      providers: [
        {
          provide: RentsService,
          useValue: mockRentsService,
        },
      ],
    }).compile();

    controller = module.get<RentsController>(RentsController);
    service = module.get<RentsService>(RentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInventoryItem (borrow)', () => {
    it('should pass context, id, and body to rentsService.rentItem', async () => {
      const mockContext = { user: { _id: new ObjectId() } };
      const req = { context: mockContext } as any;
      const itemId = new ObjectId().toHexString();
      const body = { returnTime: new Date(), subject: 'Test' };

      const expectedResponse = { success: true };
      mockRentsService.rentItem.mockResolvedValue(expectedResponse);

      const result = await controller.createInventoryItem(req, itemId, body);

      expect(result).toEqual(expectedResponse);
      expect(service.rentItem).toHaveBeenCalledWith(mockContext, itemId, body);
    });
  });

  describe('returnInventoryItem (return)', () => {
    it('should pass context, id, and body to rentsService.returnItem', async () => {
      const mockContext = { user: { _id: new ObjectId() } };
      const req = { context: mockContext } as any;
      const itemId = new ObjectId().toHexString();
      const body = { condition: 'Good' };

      const expectedResponse = { success: true };
      mockRentsService.returnItem.mockResolvedValue(expectedResponse);

      const result = await controller.returnInventoryItem(req, itemId, body);

      expect(result).toEqual(expectedResponse);
      expect(service.returnItem).toHaveBeenCalledWith(mockContext, itemId, body);
    });
  });
});
