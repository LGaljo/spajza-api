import { Test, TestingModule } from '@nestjs/testing';
import { TracingController } from './tracing.controller';
import { TracingService } from './tracing.service';
import { ObjectId } from 'mongodb';

describe('TracingController', () => {
  let controller: TracingController;
  let service: TracingService;

  const mockTracingService = {
    getChangesForObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TracingController],
      providers: [
        {
          provide: TracingService,
          useValue: mockTracingService,
        },
      ],
    }).compile();

    controller = module.get<TracingController>(TracingController);
    service = module.get<TracingService>(TracingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getChangesForItem', () => {
    it('should call service.getChangesForObject with item ID', async () => {
      const id = new ObjectId().toHexString();
      const expectedResult = [{ _id: 'trace_id', type: 'inventoryitem' }];
      mockTracingService.getChangesForObject.mockResolvedValue(expectedResult);

      const result = await controller.getChangesForItem(id);

      expect(result).toEqual(expectedResult);
      expect(service.getChangesForObject).toHaveBeenCalledWith(id);
    });
  });
});
