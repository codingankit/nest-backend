import { Global, Module } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { ConfigService } from '@/config';
import { EmailService } from './email.service';
import { NODEMAILER_TRANSPORT } from './constants';

@Global()
@Module({
  providers: [
    EmailService,
    {
      provide: NODEMAILER_TRANSPORT,
      useFactory: (config: ConfigService): Transporter => {
        const host = config.SMTP_HOST;
        const port = config.SMTP_PORT;
        const user = config.SMTP_USER;
        const pass = config.SMTP_PASS;
        const transporter = createTransport({
          host,
          port,
          auth: {
            user,
            pass,
          },
        });
        return transporter;
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
