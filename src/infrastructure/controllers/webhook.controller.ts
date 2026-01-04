import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { WebhookService, PaymentWebhookPayload } from '../../application/services/webhook.service';
import { PaymentService } from '../../application/services/payment.service';
import { PaymentStatus } from '../../domain/entities/payment.entity';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly paymentService: PaymentService,
  ) {}

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
  @ApiParam({ name: 'orderId', type: String, description: 'Order ID to approve payment' })
  async mockApprovePayment(@Param('orderId') orderId: string) {
    // This is a mock endpoint for testing
    // In production, this would come from Mercado Pago webhook
    try {
      // Find payment by orderId
      const payment = await this.paymentService.getPaymentByOrderId(orderId);
      
      // Update payment status to APPROVED
      const updatedPayment = await this.paymentService.updatePaymentStatus(
        payment.getId(),
        PaymentStatus.APPROVED,
      );

      return {
        message: 'Payment approved (mock)',
        paymentId: updatedPayment.getId(),
        orderId: updatedPayment.getOrderId(),
        status: updatedPayment.getStatus(),
      };
    } catch (error) {
      throw error;
    }
  }
}

