import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma';
import { Role } from '@prisma/client';
import { UpdateEmailDto, UpdateProfileDto } from '../dto';
import { AdminMessage, AdminURL } from '../constants';
import { randomBytes } from 'crypto';
import { AuthMessage, CryptoToken } from '@/modules/auth/constants';
import { CacheService } from '@/cache';
import { AuthUser, DEFAULT_FROM_EMAIL, ErrorCode } from '@/common';
import { ConfigService } from '@/config';
import { EmailService } from '@/infra/email';
import { AuthRedis, RedisDataForVerification } from '@/cache/constants';

@Injectable()
export class AdminProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async getProfile(id: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id, role: Role.ADMIN },
      select: {
        name: true,
        profilePic: true,
        email: true,
        gender: true,
        is2FAEnabled: true,
        twoFAMethod: true,
      },
    });

    return { message: AdminMessage.Success.GET_PROFILE, ...profile };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const data = Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { name: true, gender: true },
    });

    const updatedFields = Object.fromEntries(
      Object.entries(updated).filter(([key]) => key in data),
    );

    return {
      message: AdminMessage.Success.PROFILE_UPDATED,
      ...updatedFields,
    };
  }

  async updateEmail(user: AuthUser, dto: UpdateEmailDto) {
    const isEmailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (isEmailExists) {
      throw new ConflictException({
        message: AuthMessage.Error.EMAIL_ALREADY_REGISTERED,
        code: ErrorCode.EMAIL_REGED,
      });
    }

    const token = randomBytes(CryptoToken.LENGTH).toString(
      CryptoToken.ENCODING,
    );

    await this.cache.setEmailVerification(token, {
      id: user.id,
      email: dto.email,
    });

    const verificationLink = `${this.config.CLIENT_URL}${AdminURL.VERIFY_EMAIL(token)}`;

    const emailRes = await this.email.send({
      from: DEFAULT_FROM_EMAIL,
      to: dto.email,
      subject: 'Verify your new email address',
      html: `
              <p>Hello ${user.name},</p>
              <p>Please verify your new email by clicking the link below:</p>
              <a href="${verificationLink}">Verify Email</a>
              <p>This link will expire in 5 minutes.</p>

             `,
    });

    if (emailRes.success) {
      return {
        message: AuthMessage.Success.VERIFY_EMAIL_SENT,
        email: dto.email,
        expiresIn: AuthRedis.EmailVerification.TTL,
      };
    } else {
      throw new InternalServerErrorException({
        message: AuthMessage.Error.VERIFY_EMAIL_FAILED,
        code: ErrorCode.VERIFY_EMAIL_FAILED,
      });
    }
  }

  async verifyUpdateEmail(token: string) {
    const data =
      await this.cache.getEmailVerification<RedisDataForVerification>(token);

    if (!data)
      throw new UnprocessableEntityException({
        message: AuthMessage.Error.TOKEN_EXP_OR_USED,
        code: ErrorCode.TOKEN_EXP_OR_USED,
      });

    const { id, email } = data;

    await this.prisma.user.update({
      where: { id },
      data: { email },
    });

    await this.cache.delEmailVerification(token);

    return true;
  }
}
