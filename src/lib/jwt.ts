import { env } from '../config/env';
import { BadRequestException } from '@nestjs/common';
import { verify, sign } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export enum JwtTokenType {
  USER_AUTHENTICATION = 'USER_AUTHENTICATION',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  USER_CONFIRM_EMAIL = 'USER_CONFIRM_EMAIL',
}

export function parseToken(subject: JwtTokenType, token: string) {
  let data: any = {};

  if (!token) {
    throw new BadRequestException('Missing token');
  }
  try {
    switch (subject) {
      case JwtTokenType.USER_AUTHENTICATION:
        data = {
          ...(verify(token, env.JWT_SECRET, {
            subject: JwtTokenType.USER_AUTHENTICATION,
          }) as any),
        };
        break;
      case JwtTokenType.CHANGE_PASSWORD:
        data = {
          ...(verify(token, env.JWT_SECRET, {
            subject: JwtTokenType.CHANGE_PASSWORD,
          }) as any),
        };
        break;
      case JwtTokenType.USER_CONFIRM_EMAIL:
        data = {
          ...(verify(token, env.JWT_SECRET, {
            subject: JwtTokenType.USER_CONFIRM_EMAIL,
          }) as any),
        };
        break;
      default:
        return null;
    }

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function generateToken(
  subject: JwtTokenType,
  data: any,
  expiresIn: StringValue | number,
): string {
  switch (subject) {
    case JwtTokenType.USER_AUTHENTICATION:
      if (!data.userId) return null;
      break;
    case JwtTokenType.USER_CONFIRM_EMAIL || JwtTokenType.CHANGE_PASSWORD:
    case JwtTokenType.CHANGE_PASSWORD:
      if (!data.email || !data.userId) return null;
      break;
    default:
      break;
  }

  return sign(data, env.JWT_SECRET, {
    subject,
    expiresIn,
  });
}

export function generateActivationUrl(userId: string, email: string) {
  const token = generateToken(JwtTokenType.USER_CONFIRM_EMAIL, { userId, email }, '1d');
  if (!token) {
    throw new BadRequestException('Token was not generated');
  }
  return `${env.APP_URL}/registration/verify?token=${token}&userId=${userId}`;
}

export function generateChangePasswordUrl(userId: string, email: string) {
  const token = generateToken(JwtTokenType.CHANGE_PASSWORD, { userId, email }, '1d');
  if (!token) {
    throw new BadRequestException('Token was not generated');
  }
  return `${env.APP_URL}/password/change?token=${token}&userId=${userId}`;
}
