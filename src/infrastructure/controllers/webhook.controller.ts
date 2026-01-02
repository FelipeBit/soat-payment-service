import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { WebhookService, PaymentWebhookPayload } from '../../application/services/webhook.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive payment webhook from Mercado Pago' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        type: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        action: { type: 'string' },
        date_created: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePaymentWebhook(
    @Body() payload: PaymentWebhookPayload,
    @Headers('x-signature') signature: string,
  ) {
    await this.webhookService.processPaymentWebhook(payload);
    return { message: 'Webhook processed successfully' };
  }

  @Post('mock/approve/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock endpoint to approve payment (for testing)' })
  async mockApprovePayment(@Body() body: { orderId: string }) {
    // This is a mock endpoint for testing
    // In production, this would come from Mercado Pago webhook
    const mockPayload: PaymentWebhookPayload = {
      id: Date.now(),
      type: 'payment',
      data: { id: body.orderId },
      action: 'payment.updated',
      date_created: new Date().toISOString(),
      user_id: 12345,
      api_version: 'v1',
      live_mode: false,
    };

    await this.webhookService.processPaymentWebhook(mockPayload);
    return { message: 'Payment approved (mock)' };
  }
}

