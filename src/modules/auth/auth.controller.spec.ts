import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Role } from '../user/schemas/roles.enum';
import { ObjectId } from 'mongodb';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock jwt utility functions
jest.mock('../../lib/jwt', () => ({
  parseToken: jest.fn(),
  generateChangePasswordUrl: jest.fn(),
  JwtTokenType: {
    USER_AUTHENTICATION: 'USER_AUTHENTICATION',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD',
    USER_CONFIRM_EMAIL: 'USER_CONFIRM_EMAIL',
  },
}));

// Mock SMTP and mail templates
jest.mock('../../lib/smtp', () => ({
  sendMail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../lib/mail-templates', () => ({
  MailTemplates: {
    getTemplate: jest.fn().mockReturnValue(() => 'mocked template content'),
  },
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userService: UserService;

  const mockUser = {
    _id: new ObjectId(),
    username: 'testuser',
    email: 'test@example.com',
    role: Role.USER,
    hash: 'hashed_password',
  };

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockUserService = {
    resendVerification: jest.fn(),
    updateRole: jest.fn(),
    changePassword: jest.fn(),
    findOneByUsernameOrEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return unapproved status if user role is UNAPPROVED', async () => {
      const unapprovedUser = { ...mockUser, role: Role.UNAPPROVED };
      const req = {
        user: unapprovedUser,
        body: { saveme: true },
      } as any;

      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(req);

      expect(result).toEqual({
        success: false,
        reason: Role.UNAPPROVED,
        userId: unapprovedUser._id.toHexString(),
      });
    });

    it('should return login success data if user role is APPROVED/USER', async () => {
      const req = {
        user: mockUser,
        body: { saveme: true },
      } as any;

      const loginResponse = { access_token: 'token', user: mockUser };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(req);

      expect(result).toEqual({
        success: true,
        data: loginResponse,
      });
      expect(authService.login).toHaveBeenCalledWith(mockUser, true);
    });
  });

  describe('getProfile', () => {
    it('should return req.context.user', () => {
      const req = {
        context: {
          user: mockUser,
        },
      } as any;

      const result = controller.getProfile(req);

      expect(result).toEqual(mockUser);
    });
  });

  describe('resendVerification', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      await expect(controller.resendVerification({})).rejects.toThrow(BadRequestException);
    });

    it('should call userService.resendVerification if userId is provided', async () => {
      const userId = mockUser._id.toHexString();
      mockUserService.resendVerification.mockResolvedValue({ success: true });

      const result = await controller.resendVerification({ userId });

      expect(result).toEqual({ success: true });
      expect(userService.resendVerification).toHaveBeenCalledWith(userId);
    });
  });

  describe('accountVerification', () => {
    it('should return success false if parseToken returns null', async () => {
      const { parseToken } = require('../../lib/jwt');
      parseToken.mockReturnValue(null);

      const result = await controller.accountVerification({ token: 'invalid_token' });

      expect(result).toEqual({ success: false });
    });

    it('should call userService.updateRole and return success true if token is valid', async () => {
      const { parseToken } = require('../../lib/jwt');
      const userId = mockUser._id.toHexString();
      parseToken.mockReturnValue({ userId });

      const result = await controller.accountVerification({ token: 'valid_token' });

      expect(result).toEqual({ success: true });
      expect(userService.updateRole).toHaveBeenCalledWith(userId, Role.USER);
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if old_pass or new_pass is missing', async () => {
      const reqEmpty = { body: {}, context: { user: mockUser } } as any;
      await expect(controller.changePassword(reqEmpty)).rejects.toThrow(BadRequestException);
    });

    it('should return success false and reason WRONG_OLD_PASS if passwords do not match', async () => {
      const req = {
        body: { old_pass: 'wrong', new_pass: 'new' },
        context: { user: mockUser },
      } as any;
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await controller.changePassword(req);

      expect(result).toEqual({ success: false, reason: 'WRONG_OLD_PASS' });
    });

    it('should change password and return success true if credentials are correct', async () => {
      const req = {
        body: { old_pass: 'correct', new_pass: 'new' },
        context: { user: mockUser },
      } as any;
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await controller.changePassword(req);

      expect(result).toEqual({ success: true });
      expect(userService.changePassword).toHaveBeenCalledWith(mockUser._id.toHexString(), 'new');
    });
  });

  describe('requestPasswordChange', () => {
    it('should throw BadRequestException if email is missing', async () => {
      await expect(controller.requestPasswordChange({})).rejects.toThrow(BadRequestException);
    });

    it('should return success true if user is not found', async () => {
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(null);

      const result = await controller.requestPasswordChange({ email: 'nonexistent@example.com' });

      expect(result).toEqual({ success: true });
    });

    it('should generate password change url, send email and return success true if user is found', async () => {
      const { generateChangePasswordUrl } = require('../../lib/jwt');
      const changeUrl = 'http://example.com/reset';
      generateChangePasswordUrl.mockReturnValue(changeUrl);
      mockUserService.findOneByUsernameOrEmail.mockResolvedValue(mockUser);

      const result = await controller.requestPasswordChange({ email: mockUser.email });

      expect(result).toEqual({ success: true });
      expect(userService.findOneByUsernameOrEmail).toHaveBeenCalledWith(mockUser.email);
      expect(generateChangePasswordUrl).toHaveBeenCalledWith(mockUser._id.toHexString(), mockUser.email);
    });
  });

  describe('ext-change-password (externalPasswordChange)', () => {
    it('should return success false if token is invalid', async () => {
      const { parseToken } = require('../../lib/jwt');
      parseToken.mockReturnValue(null);

      const result = await controller.externalPasswordChange({ token: 'invalid_token', new_pass: 'new' });

      expect(result).toEqual({ success: false });
    });

    it('should throw BadRequestException if new_pass is missing', async () => {
      const { parseToken } = require('../../lib/jwt');
      parseToken.mockReturnValue({ userId: '123' });

      await expect(controller.externalPasswordChange({ token: 'valid_token' })).rejects.toThrow(BadRequestException);
    });

    it('should change password externally and return success true', async () => {
      const { parseToken } = require('../../lib/jwt');
      parseToken.mockReturnValue({ userId: '123' });

      const result = await controller.externalPasswordChange({ token: 'valid_token', new_pass: 'new' });

      expect(result).toEqual({ success: true });
      expect(userService.changePassword).toHaveBeenCalledWith('123', 'new');
    });
  });
});
