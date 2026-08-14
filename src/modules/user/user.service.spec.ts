import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { Role } from './schemas/roles.enum';
import { ObjectId } from 'mongodb';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock SMTP and MailTemplates
jest.mock('../../lib/smtp', () => ({
  sendMail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../lib/mail-templates', () => ({
  MailTemplates: {
    getTemplate: jest.fn().mockReturnValue(() => 'Mocked email content'),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: any;

  const mockUserDoc = {
    _id: new ObjectId(),
    username: 'john_doe',
    email: 'john@example.com',
    role: Role.USER,
    hash: 'old_hashed_password',
    salt: 10,
    save: jest.fn(),
  };

  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockImplementation(function() {
        return Promise.resolve({ _id: new ObjectId(), ...this });
      }),
    }));

    mockUserModel.find = jest.fn().mockReturnValue(mockQuery);
    mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);
    mockUserModel.updateOne = jest.fn().mockReturnValue(mockQuery);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new user, and trigger email verification', async () => {
      const createDto = {
        username: 'new_guy',
        email: 'new@example.com',
        password: 'password123',
      };

      // Mock user lookup inside resendVerification (which is called during create)
      const mockResultDoc = {
        _id: new ObjectId(),
        username: 'new_guy',
        email: 'new@example.com',
        role: Role.UNAPPROVED,
      };
      mockQuery.exec.mockResolvedValueOnce(mockResultDoc); // for findOne inside resendVerification

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.username).toBe('new_guy');
      expect(mockUserModel).toHaveBeenCalledWith(createDto);
    });
  });

  describe('changePassword', () => {
    it('should successfully update a user password with a new bcrypt hash', async () => {
      const mockExisting = {
        _id: mockUserDoc._id,
        username: 'john_doe',
        email: 'john@example.com',
        hash: 'old_hash',
        salt: 10,
      };

      mockQuery.exec.mockResolvedValueOnce(mockExisting); // findOne inside changePassword
      mockQuery.exec.mockResolvedValueOnce({ acknowledged: true }); // updateOne inside changePassword

      await service.changePassword(mockUserDoc._id, 'brand_new_password');

      expect(mockUserModel.findOne).toHaveBeenCalled();
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUserDoc._id },
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve list of users without password hashes by default', async () => {
      mockQuery.exec.mockResolvedValue([mockUserDoc]);

      const result = await service.findAll();

      expect(result).toEqual([mockUserDoc]);
      expect(mockUserModel.find).toHaveBeenCalledWith({ _deletedAt: null });
      expect(mockQuery.select).toHaveBeenCalledWith({
        _id: 1,
        username: 1,
        email: 1,
        role: 1,
      });
    });

    it('should retrieve list of users with password hashes if requested', async () => {
      mockQuery.exec.mockResolvedValue([mockUserDoc]);

      await service.findAll(true);

      expect(mockQuery.select).toHaveBeenCalledWith({
        _id: 1,
        username: 1,
        email: 1,
        role: 1,
        hash: 1,
        salt: 1,
      });
    });
  });

  describe('findOneByUsernameOrEmail', () => {
    it('should query MongoDB using $or filter for username and email', async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc);

      const result = await service.findOneByUsernameOrEmail('john@example.com');

      expect(result).toEqual(mockUserDoc);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: 'john@example.com' }, { email: 'john@example.com' }],
        _deletedAt: null,
      });
    });
  });

  describe('findOneById', () => {
    it('should query MongoDB by casting string id to ObjectId', async () => {
      mockQuery.exec.mockResolvedValue(mockUserDoc);

      const result = await service.findOneById(mockUserDoc._id.toHexString());

      expect(result).toEqual(mockUserDoc);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        _id: mockUserDoc._id,
        _deletedAt: null,
      });
    });
  });

  describe('update', () => {
    it('should update user fields by calling updateOne', async () => {
      mockQuery.exec.mockResolvedValue({ acknowledged: true });

      const updates = { username: 'john_the_updated' };
      await service.update(mockUserDoc._id.toHexString(), updates);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUserDoc._id, _deletedAt: null },
        { $set: updates },
      );
    });
  });

  describe('updateRole', () => {
    it('should successfully update user role to an existing Role enum', async () => {
      const testUser = {
        _id: mockUserDoc._id,
        role: Role.UNAPPROVED,
      };

      mockQuery.exec.mockResolvedValueOnce(testUser); // findOne inside updateRole
      mockQuery.exec.mockResolvedValueOnce({ acknowledged: true }); // updateOne inside updateRole
      mockQuery.exec.mockResolvedValueOnce({ ...testUser, role: Role.USER }); // findOneById inside updateRole return

      const result = await service.updateRole(mockUserDoc._id.toHexString(), 'USER');

      expect(result).toBeDefined();
      expect(result.role).toBe(Role.USER);
    });

    it('should throw BadRequestException if requested role is invalid', async () => {
      await expect(
        service.updateRole(mockUserDoc._id.toHexString(), 'SUPER_DUPER_ROLE'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user by setting _deletedAt to date', async () => {
      mockQuery.exec.mockResolvedValue({ acknowledged: true });

      await service.deleteUser(mockUserDoc._id);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUserDoc._id },
        { $set: { _deletedAt: expect.any(Date) } },
      );
    });
  });
});
