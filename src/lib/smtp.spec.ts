import * as nodemailer from 'nodemailer';
import { sendMail } from './smtp';

jest.mock('nodemailer');

describe('smtp lib', () => {
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  it('should successfully send an email when verify and sendMail succeed', async () => {
    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    };

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await sendMail(mailOptions);

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
    expect(consoleLogSpy).toHaveBeenCalledWith('Server is ready to take our messages');

    consoleLogSpy.mockRestore();
  });

  it('should catch error if verify fails', async () => {
    mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    };

    await expect(sendMail(mailOptions)).resolves.toBeUndefined();

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should catch error if sendMail fails after verification succeeds', async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error('Sending failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const mailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    };

    await expect(sendMail(mailOptions)).resolves.toBeUndefined();

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
