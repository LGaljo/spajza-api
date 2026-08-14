import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = {
    _id: new ObjectId(),
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER',
    hash: 'hashedpassword',
  };

  const mockUserService = {
    findOneByUsernameOrEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if username/email and password match', async () => {
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('testuser', 'correctpassword');

      expect(result).toEqual(mockUser);
      expect(userService.findOneByUsernameOrEmail).toHaveBeenCalledWith('testuser', true);
    });

    it('should return null if user is not found', async () => {
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user info, with 7d expiration if saveme is true', async () => {
      const returnedUser = { ...mockUser, hash: undefined };
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(returnedUser);

      const result = await service.login(mockUser, true);

      expect(result).toEqual({
        access_token: 'mocked_token',
        user: returnedUser,
      });
      expect(userService.findOneByUsernameOrEmail).toHaveBeenCalledWith(mockUser.username, false);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: mockUser.username,
          userId: mockUser._id.toHexString(),
          email: mockUser.email,
          role: mockUser.role,
        },
        { expiresIn: '7d' },
      );
    });

    it('should return access_token and user info, with 2d expiration if saveme is false', async () => {
      const returnedUser = { ...mockUser, hash: undefined };
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(returnedUser);

      const result = await service.login(mockUser, false);

      expect(result).toEqual({
        access_token: 'mocked_token',
        user: returnedUser,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          username: mockUser.username,
          userId: mockUser._id.toHexString(),
          email: mockUser.email,
          role: mockUser.role,
        },
        { expiresIn: '2d' },
      );
    });
  });
});
