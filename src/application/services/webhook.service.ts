import { Injectable } from '@nestjs/common';
import { PaymentService } from './payment.service';

export interface PaymentWebhookPayload {
  id: number;
  type: string;
  data: {
    id: string;
  };
  action: string;
  date_created: string;
  user_id: number;
  api_version: string;
  live_mode: boolean;
}

@Injectable()
export class WebhookService {
  constructor(private readonly paymentService: PaymentService) {}

  async processPaymentWebhook(payload: PaymentWebhookPayload): Promise<void> {
    try {
      this.validateWebhookPayload(payload);

      switch (payload.type) {
        case 'payment':
          await this.processPaymentNotification(payload.data.id);
          break;
        case 'merchant_order':
          await this.processMerchantOrderNotification(payload.data.id);
          break;
        default:
          console.log(`Unsupported webhook type: ${payload.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async processPaymentNotification(externalPaymentId: string): Promise<void> {
    // For now, we'll simulate approved payment
    // In production, you'd fetch the payment status from Mercado Pago
    await this.paymentService.processWebhook(externalPaymentId, 'approved');
  }

  private async processMerchantOrderNotification(merchantOrderId: string): Promise<void> {
    console.log(`Processing merchant order notification: ${merchantOrderId}`);
    // Implementation for merchant order processing
  }

  private validateWebhookPayload(payload: PaymentWebhookPayload): void {
    if (!payload.id || !payload.type || !payload.data || !payload.data.id) {
      throw new Error('Invalid webhook payload structure');
    }

    if (!['payment', 'merchant_order'].includes(payload.type)) {
      throw new Error(`Unsupported webhook type: ${payload.type}`);
    }
  }
}

