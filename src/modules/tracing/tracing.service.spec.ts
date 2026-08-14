import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TracingService } from './tracing.service';
import { Trace } from './schema/tracing.schema';
import { ObjectId } from 'mongodb';

describe('TracingService', () => {
  let service: TracingService;
  let mockTraceModel: any;

  const mockTraceQuery = {
    exec: jest.fn(),
  };

  beforeEach(async () => {
    mockTraceModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve({ _id: new ObjectId(), ...this });
      }),
    }));

    mockTraceModel.aggregate = jest.fn().mockReturnValue(mockTraceQuery);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: getModelToken(Trace.name),
          useValue: mockTraceModel,
        },
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveChange', () => {
    it('should generate object diff and save a Trace document', async () => {
      const nowId = new ObjectId();
      const beforeObj = { _id: nowId, name: 'Apple', count: 1 };
      const nowObj = { _id: nowId, name: 'Apple', count: 5 };
      const userId = new ObjectId().toHexString();

      await service.saveChange('inventoryitem', beforeObj, nowObj, userId);

      expect(mockTraceModel).toHaveBeenCalledWith({
        type: 'inventoryitem',
        changes: [
          {
            key: 'count',
            type: 'changed',
            valueBefore: 1,
            valueNow: 5,
          },
        ],
        originalObjectId: nowId,
        user: new ObjectId(userId),
      });
    });
  });

  describe('getChangesForObject', () => {
    it('should query MongoDB using match lookup and group aggregation pipelines', async () => {
      const targetId = new ObjectId().toHexString();
      const expectedHistory = [{ _id: 'some_trace_id', type: 'inventoryitem' }];
      mockTraceQuery.exec.mockResolvedValue(expectedHistory);

      const result = await service.getChangesForObject(targetId);

      expect(result).toEqual(expectedHistory);
      expect(mockTraceModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { $match: { originalObjectId: new ObjectId(targetId) } },
        ]),
      );
    });
  });
});
