import { Module } from '@nestjs/common';
import { AdminProfileController } from './controllers';
import { AdminProfileService } from './services';

@Module({
  controllers: [AdminProfileController],
  providers: [AdminProfileService],
})
export class AdminModule {}
