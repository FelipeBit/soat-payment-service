import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, PaymentWebhookPayload } from './webhook.service';
import { PaymentService } from './payment.service';

describe('WebhookService', () => {
  let service: WebhookService;
  let paymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const mockPaymentService = {
      processWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    paymentService = module.get(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPaymentWebhook', () => {
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

      paymentService.processWebhook.mockResolvedValue(undefined);

      await service.processPaymentWebhook(payload);

      expect(paymentService.processWebhook).toHaveBeenCalledWith('external-payment-1', 'approved');
    });

    it('should throw error for invalid payload structure', async () => {
      const invalidPayload = {
        id: 12345,
        type: 'payment',
        data: {},
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 12345,
        api_version: 'v1',
        live_mode: false,
      } as any;

      await expect(service.processPaymentWebhook(invalidPayload)).rejects.toThrow('Invalid webhook payload structure');
    });

    it('should throw error for unsupported webhook type', async () => {
      const payload: PaymentWebhookPayload = {
        id: 12345,
        type: 'unsupported',
        data: { id: 'external-payment-1' },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 12345,
        api_version: 'v1',
        live_mode: false,
      } as any;

      await expect(service.processPaymentWebhook(payload)).rejects.toThrow('Unsupported webhook type');
    });

    it('should handle merchant_order type', async () => {
      const payload: PaymentWebhookPayload = {
        id: 12345,
        type: 'merchant_order',
        data: { id: 'merchant-order-1' },
        action: 'merchant_order.updated',
        date_created: new Date().toISOString(),
        user_id: 12345,
        api_version: 'v1',
        live_mode: false,
      };

      await service.processPaymentWebhook(payload);

      expect(paymentService.processWebhook).not.toHaveBeenCalled();
    });
  });
});

