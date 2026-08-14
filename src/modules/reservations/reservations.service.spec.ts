import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.schema';
import { ObjectId } from 'mongodb';
import { Context } from '../../context';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let mockModel: any;
  let mockQuery: any;

  beforeEach(async () => {
    mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    mockModel = jest.fn().mockImplementation((dto) => {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: new ObjectId(), ...dto }),
      };
    });

    mockModel.find = jest.fn().mockReturnValue(mockQuery);
    mockModel.updateOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
    mockModel.findOne = jest.fn().mockReturnValue(mockQuery);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a reservation successfully', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;
      const body = {
        item: new ObjectId().toHexString(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        subject: 'My reservation',
      };

      const result = await service.create(mockContext, body);
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if startDate >= endDate', async () => {
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;
      const body = {
        item: new ObjectId().toHexString(),
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date().toISOString(),
      };

      await expect(service.create(mockContext, body)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted reservations', async () => {
      const mockReservation = {
        _id: new ObjectId(),
        item: new ObjectId(),
        user: new ObjectId(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        subject: 'Event testing',
      };
      mockQuery.exec.mockResolvedValue([mockReservation]);

      const result = await service.findAll();
      expect(result).toEqual([mockReservation]);
      expect(mockModel.find).toHaveBeenCalledWith({ _deletedAt: null });
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not the owner and not keeper/admin', async () => {
      const id = new ObjectId().toHexString();
      const mockContext: Context = {
        user: { _id: new ObjectId(), username: 'tester', role: 'USER' },
      } as any;

      mockQuery.exec.mockResolvedValue({
        _id: new ObjectId(id),
        user: new ObjectId(),
      });

      await expect(service.update(mockContext, id, { subject: 'new' })).rejects.toThrow(ForbiddenException);
    });

    it('should update successfully if owner', async () => {
      const id = new ObjectId().toHexString();
      const userId = new ObjectId();
      const mockContext: Context = {
        user: { _id: userId, username: 'tester', role: 'USER' },
      } as any;

      const mockResObj = {
        _id: new ObjectId(id),
        user: userId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      };

      mockQuery.exec
        .mockResolvedValueOnce(mockResObj)
        .mockResolvedValueOnce({ ...mockResObj, subject: 'updated' });

      const result = await service.update(mockContext, id, { subject: 'updated' });
      expect(result.subject).toBe('updated');
    });
  });

  describe('remove', () => {
    it('should soft delete if owner', async () => {
      const id = new ObjectId().toHexString();
      const userId = new ObjectId();
      const mockContext: Context = {
        user: { _id: userId, username: 'tester', role: 'USER' },
      } as any;

      mockQuery.exec.mockResolvedValue({
        _id: new ObjectId(id),
        user: userId,
      });

      await service.remove(mockContext, id);
      expect(mockModel.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(id) },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });
  });
});
