import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryItemsService } from '../inventoryitem/inventoryitem.service';
import { MailTemplates } from '../../lib/mail-templates';
import { sendMail } from '../../lib/smtp';
import { env } from '../../config/env';

@Injectable()
export class RentsSchedulerService {
  private readonly logger = new Logger(RentsSchedulerService.name);

  constructor(private readonly itemService: InventoryItemsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleOverdueReminders() {
    this.logger.log('Starting daily overdue reminders check...');
    try {
      const overdueItems = await this.itemService.findOverdueItems();
      this.logger.log(`Found ${overdueItems.length} overdue items.`);

      for (const item of overdueItems) {
        const renter = item.rents?.renter;
        if (!renter || !renter.email) {
          this.logger.warn(`No valid renter email for overdue item ${item.name} (${item._id})`);
          continue;
        }

        const returnDate = item.rents.returnTime ? new Date(item.rents.returnTime) : null;
        let formattedDate = 'Neznan datum';
        if (returnDate) {
          formattedDate = `${returnDate.getDate()}. ${returnDate.getMonth() + 1}. ${returnDate.getFullYear()}`;
        }

        const template = MailTemplates.getTemplate('overdue-reminder');
        const mailData = {
          username: renter.username || renter.email,
          itemName: item.name,
          returnTime: formattedDate,
          url: `${env.APP_URL}/item/${item._id}`,
        };

        this.logger.log(`Sending overdue reminder for "${item.name}" to <${renter.email}>`);
        await sendMail({
          from: `Špajza <${env.MAIL_ADDRESS}>`,
          to: renter.email,
          subject: `Opomnik za zamudo: ${item.name}`,
          html: template(mailData),
        });
      }
      this.logger.log('Completed daily overdue reminders check.');
    } catch (error) {
      this.logger.error('Error in overdue reminders cron:', error);
    }
  }
}
