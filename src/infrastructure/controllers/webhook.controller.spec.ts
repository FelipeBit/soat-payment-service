import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService, PaymentWebhookPayload } from '../../application/services/webhook.service';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: jest.Mocked<WebhookService>;

  beforeEach(async () => {
    const mockWebhookService = {
      processPaymentWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get(WebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaymentWebhook', () => {
    it('should process payment webhook successfully', async () => {
      const payload: PaymentWebhookPayload = {
        id: 12345,
        type: 'payment',
        data: { id: 'external-payment-1' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 12345,
        api_version: 'v1',
        live_mode: false,
      };

      webhookService.processPaymentWebhook.mockResolvedValue(undefined);

      const result = await controller.handlePaymentWebhook(payload, 'signature');

      expect(result).toBeDefined();
      expect(result.message).toBe('Webhook processed successfully');
      expect(webhookService.processPaymentWebhook).toHaveBeenCalledWith(payload);
    });
  });

  describe('mockApprovePayment', () => {
    it('should approve payment via mock endpoint', async () => {
      webhookService.processPaymentWebhook.mockResolvedValue(undefined);

      const result = await controller.mockApprovePayment({ orderId: 'order-1' });

      expect(result).toBeDefined();
      expect(result.message).toBe('Payment approved (mock)');
      expect(webhookService.processPaymentWebhook).toHaveBeenCalled();
    });
  });
});

