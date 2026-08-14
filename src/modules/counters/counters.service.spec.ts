import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CountersService } from './counters.service';
import { Counters } from './counter.schema';

describe('CountersService', () => {
  let service: CountersService;
  let model: any;

  const mockCountersModel = {
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountersService,
        {
          provide: getModelToken(Counters.name),
          useValue: mockCountersModel,
        },
      ],
    }).compile();

    service = module.get<CountersService>(CountersService);
    model = module.get<any>(getModelToken(Counters.name));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLatestCode', () => {
    it('should call findOneAndUpdate and return the incremented value', async () => {
      const mockExec = jest.fn().mockResolvedValue({ key: 'test-key', value: 42 });
      mockCountersModel.findOneAndUpdate.mockReturnValue({
        exec: mockExec,
      });

      const result = await service.getLatestCode('test-key');

      expect(result).toBe(42);
      expect(mockCountersModel.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'test-key' },
        { $inc: { value: 1 } },
        { upsert: true, returnOriginal: false },
      );
      expect(mockExec).toHaveBeenCalled();
    });
  });
});
