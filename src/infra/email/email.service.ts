import { Inject, Injectable } from '@nestjs/common';
import { SendMailOptions, Transporter } from 'nodemailer';
import { NodeMailerResponse } from './types';
import { NODEMAILER_TRANSPORT } from './constants';

@Injectable()
export class EmailService {
  constructor(
    @Inject(NODEMAILER_TRANSPORT) private readonly transporter: Transporter,
  ) {}
  async send(options: SendMailOptions) {
    const info = (await this.transporter.sendMail(
      options,
    )) as NodeMailerResponse;
    return {
      success: info.rejected.length === 0,
      to: info.accepted,
      messageId: info.messageId,
      response: info.response,
      durationMs: info.envelopeTime + info.messageTime,
    };
  }
}
