import * as nodemailer from 'nodemailer';
import { Options, MailOptions } from 'nodemailer/lib/smtp-transport';
// import { Attachment } from 'nodemailer/lib/mailer';
import { env } from '../config/env';
import { InternalServerErrorException } from '@nestjs/common';

const options: Options = {
  port: env.MAIL_PORT,
  host: env.MAIL_HOST,
  secure: true,
  auth: {
    user: env.MAIL_ADDRESS,
    pass: env.MAIL_PASSWORD,
  },
};

export async function sendMail(mail: MailOptions): Promise<void> {
  const transporter = nodemailer.createTransport(options);

  try {
    await transporter
      .verify()
      .then((success) => {
        console.log(success);
        console.log('Server is ready to take our messages');
      })
      .catch((error) => {
        console.error(error);
        throw new InternalServerErrorException('nodemailer verification failed');
      });

    await transporter
      .sendMail(mail)
      .then((info) => {
        console.log(info);
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (err) {
    console.error(err);
  }
}
