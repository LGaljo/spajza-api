import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ObjectId } from 'mongodb';
import { Role } from './schemas/roles.enum';
import { BadRequestException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should retrieve list of users from service', async () => {
      const expectedUsers = [{ username: 'test1' }, { username: 'test2' }];
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.getUsers();

      expect(result).toEqual(expectedUsers);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should retrieve single user details by id', async () => {
      const id = new ObjectId().toHexString();
      const expectedUser = { _id: id, username: 'tester' };
      mockUserService.findOneById.mockResolvedValue(expectedUser);

      const result = await controller.getUser(id);

      expect(result).toEqual(expectedUser);
      expect(service.findOneById).toHaveBeenCalledWith(id);
    });
  });

  describe('registerUser', () => {
    it('should register new user, strip role payload, and report success', async () => {
      const payload = {
        username: 'luka',
        email: 'luka@example.com',
        password: 'password',
        role: Role.ADMIN, // should be deleted
      };

      const expectedUser = { username: 'luka', email: 'luka@example.com', role: Role.UNAPPROVED };
      mockUserService.create.mockResolvedValue(expectedUser);

      const result = await controller.registerUser(payload);

      expect(result).toEqual({ user: expectedUser, success: true });
      expect(payload.role).toBeUndefined(); // Role stripped
      expect(service.create).toHaveBeenCalledWith(payload);
    });

    it('should throw BadRequestException if username is missing', async () => {
      const payload = {
        email: 'luka@example.com',
        password: 'password',
      };

      await expect(controller.registerUser(payload)).rejects.toThrow(BadRequestException);
    });

    it('should return error response if MongoDB returns duplicate key code 11000', async () => {
      const payload = {
        username: 'duplicate',
        email: 'duplicate@example.com',
        password: 'password',
      };

      const mongoError: any = new Error('Duplicate key');
      mongoError.code = 11000;
      mongoError.keyValue = { username: 'duplicate' };
      mockUserService.create.mockRejectedValue(mongoError);

      const result = await controller.registerUser(payload);

      expect(result).toEqual({
        success: false,
        code: 11000,
        key: { username: 'duplicate' },
      });
    });
  });

  describe('updateUser', () => {
    it('should call service.update with parameters and report updates status', async () => {
      const id = new ObjectId().toHexString();
      const updates = { email: 'updated@example.com' };
      mockUserService.update.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

      const result = await controller.updateUser(id, updates);

      expect(result).toEqual({ matchedCount: 1, modifiedCount: 1 });
      expect(service.update).toHaveBeenCalledWith(id, updates);
    });
  });

  describe('updateUserRole', () => {
    it('should call service.updateRole with new role', async () => {
      const id = new ObjectId().toHexString();
      const expectedUser = { _id: id, role: Role.KEEPER };
      mockUserService.updateRole.mockResolvedValue(expectedUser);

      const result = await controller.updateUserRole(id, { role: 'KEEPER' });

      expect(result).toEqual(expectedUser);
      expect(service.updateRole).toHaveBeenCalledWith(id, 'KEEPER');
    });
  });

  describe('deleteUser', () => {
    it('should call service.deleteUser with user id', async () => {
      const id = new ObjectId().toHexString();
      mockUserService.deleteUser.mockResolvedValue({ acknowledged: true });

      const result = await controller.deleteUser(id);

      expect(result).toEqual({ acknowledged: true });
      expect(service.deleteUser).toHaveBeenCalledWith(id);
    });
  });
});
