import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ObjectId } from 'mongodb';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: ReservationsService;

  const mockReservationsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    service = module.get<ReservationsService>(ReservationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReservations', () => {
    it('should call service.findAll and return list of reservations', async () => {
      const expectedResult = [{ _id: new ObjectId(), description: 'Slot' }];
      mockReservationsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.getReservations();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('createReservation', () => {
    it('should pass context and body payload to service.create', async () => {
      const mockContext = { user: { _id: new ObjectId() } };
      const req = { context: mockContext } as any;
      const body = { itemId: 'item_id', time: new Date() };

      const expectedResponse = { success: true };
      mockReservationsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.createReservation(req, body);

      expect(result).toEqual(expectedResponse);
      expect(service.create).toHaveBeenCalledWith(mockContext, body);
    });
  });

  describe('updateReservation', () => {
    it('should pass context, body payload, and reservation ID to service.update', async () => {
      const mockContext = { user: { _id: new ObjectId() } };
      const req = { context: mockContext } as any;
      const id = new ObjectId().toHexString();
      const body = { time: new Date() };

      const expectedResponse = { success: true };
      mockReservationsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.updateReservation(req, body, id);

      expect(result).toEqual(expectedResponse);
      expect(service.update).toHaveBeenCalledWith(mockContext, id, body);
    });
  });

  describe('deleteReservation', () => {
    it('should pass context and reservation ID to service.remove', async () => {
      const mockContext = { user: { _id: new ObjectId() } };
      const req = { context: mockContext } as any;
      const id = new ObjectId().toHexString();

      const expectedResponse = { success: true };
      mockReservationsService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.deleteReservation(req, id);

      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(mockContext, id);
    });
  });
});
