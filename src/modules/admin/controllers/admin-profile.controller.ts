import { Body, Controller, Get, Patch, Query, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Admin, AuthUser, GetUser, UserKey } from '@/common';
import { AdminProfileService } from '../services';
import { AdminRoute } from '../constants';
import { UpdateEmailDto, UpdateProfileDto } from '../dto';
import { AuthQuery } from '@/modules/auth/constants';
import { Response } from 'express';
import { ConfigService } from '@/config';

@Controller(AdminRoute.Profile.BASE)
@Admin()
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AdminProfileController {
  constructor(
    private readonly adminProfile: AdminProfileService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getProfile(@GetUser(UserKey.ID) id: string) {
    return await this.adminProfile.getProfile(id);
  }

  @Patch()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async updateProfile(
    @GetUser(UserKey.ID) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.adminProfile.updateProfile(id, dto);
  }

  @Patch(AdminRoute.Profile.EMAIL)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async updateEmail(@GetUser() user: AuthUser, @Body() dto: UpdateEmailDto) {
    return await this.adminProfile.updateEmail(user, dto);
  }

  @Get(AdminRoute.Profile.VERIFY_EMAIL)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyUpdateEmail(
    @Query(AuthQuery.TOKEN) token: string,
    @Res() res: Response,
  ) {
    const result = await this.adminProfile.verifyUpdateEmail(token);
    if (result) {
      res.redirect(`${this.config.CLIENT_URL}/${AdminRoute.Profile.BASE}`);
    }
  }
}
