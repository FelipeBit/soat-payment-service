import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService, PaymentWebhookPayload } from '../../application/services/webhook.service';
import { PaymentService } from '../../application/services/payment.service';
import { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: jest.Mocked<WebhookService>;
  let paymentService: jest.Mocked<PaymentService>;

  beforeEach(async () => {
    const mockWebhookService = {
      processPaymentWebhook: jest.fn(),
    };

    const mockPayment = new Payment(
      'payment-1',
      'order-1',
      100.0,
      'Test payment',
      PaymentStatus.PENDING,
      PaymentMethod.QR_CODE,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );

    const mockApprovedPayment = new Payment(
      'payment-1',
      'order-1',
      100.0,
      'Test payment',
      PaymentStatus.APPROVED,
      PaymentMethod.QR_CODE,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );

    const mockPaymentService = {
      getPaymentByOrderId: jest.fn().mockResolvedValue(mockPayment),
      updatePaymentStatus: jest.fn().mockResolvedValue(mockApprovedPayment),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get(WebhookService);
    paymentService = module.get(PaymentService);
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
      const result = await controller.mockApprovePayment('order-1');

      expect(result).toBeDefined();
      expect(result.message).toBe('Payment approved (mock)');
      expect(result.paymentId).toBe('payment-1');
      expect(result.orderId).toBe('order-1');
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(paymentService.getPaymentByOrderId).toHaveBeenCalledWith('order-1');
      expect(paymentService.updatePaymentStatus).toHaveBeenCalledWith('payment-1', PaymentStatus.APPROVED);
    });
  });
});

