import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PaymentService } from './payment.service';
import { PaymentPort } from '../../domain/ports/payment.port';
import { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';
import {
  PaymentNotFoundException,
  PaymentAlreadyExistsException,
  PaymentProcessingException,
} from '../../domain/exceptions/payment.exception';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentPort: jest.Mocked<PaymentPort>;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

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

  beforeEach(async () => {
    const mockPaymentPort = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderId: jest.fn(),
      findByExternalPaymentId: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return 'test-token';
        if (key === 'ORDER_SERVICE_URL') return 'http://order-service:3001';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: 'PaymentPort',
          useValue: mockPaymentPort,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentPort = module.get('PaymentPort');
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a new payment successfully', async () => {
      paymentPort.findByOrderId.mockResolvedValue(null);
      paymentPort.save.mockResolvedValue(mockPayment);

      const result = await service.createPayment({
        orderId: 'order-1',
        amount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBe(mockPayment);
      expect(paymentPort.save).toHaveBeenCalled();
    });

    it('should throw PaymentAlreadyExistsException when payment already exists', async () => {
      paymentPort.findByOrderId.mockResolvedValue(mockPayment);

      await expect(
        service.createPayment({
          orderId: 'order-1',
          amount: 100.0,
          description: 'Test payment',
        }),
      ).rejects.toThrow(PaymentAlreadyExistsException);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully with test token', async () => {
      paymentPort.findByOrderId.mockResolvedValue(null);
      paymentPort.save.mockResolvedValue(mockPayment);

      const result = await service.generateQRCode({
        orderId: 'order-1',
        amount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(result.paymentId).toBeDefined();
      expect(result.qrData).toBeDefined();
      expect(result.qrCodeBase64).toBeDefined();
    });

    it('should use existing payment if found', async () => {
      paymentPort.findByOrderId.mockResolvedValue(mockPayment);
      paymentPort.save.mockResolvedValue(mockPayment);

      const result = await service.generateQRCode({
        orderId: 'order-1',
        amount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(paymentPort.findByOrderId).toHaveBeenCalledWith('order-1');
    });

    it('should throw PaymentProcessingException on error', async () => {
      paymentPort.findByOrderId.mockResolvedValue(null);
      // First save succeeds (createPayment), second save fails (save QR code)
      paymentPort.save
        .mockResolvedValueOnce(mockPayment)
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.generateQRCode({
          orderId: 'order-1',
          amount: 100.0,
          description: 'Test payment',
        }),
      ).rejects.toThrow(PaymentProcessingException);
    });

    it('should generate QR code with real Mercado Pago token', async () => {
      // Create a new service instance with real token
      const realTokenConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return 'real-token-123';
          if (key === 'ORDER_SERVICE_URL') return 'http://order-service:3001';
          return undefined;
        }),
      };

      const realTokenHttpService = {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };

      const realTokenModule = await Test.createTestingModule({
        providers: [
          PaymentService,
          {
            provide: 'PaymentPort',
            useValue: paymentPort,
          },
          {
            provide: HttpService,
            useValue: realTokenHttpService,
          },
          {
            provide: ConfigService,
            useValue: realTokenConfigService,
          },
        ],
      }).compile();

      const realTokenService = realTokenModule.get<PaymentService>(PaymentService);

      const paymentWithToken = new Payment(
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

      paymentPort.findByOrderId.mockResolvedValue(null);
      paymentPort.save
        .mockResolvedValueOnce(paymentWithToken) // createPayment
        .mockResolvedValueOnce(paymentWithToken); // save QR code
      realTokenHttpService.put.mockReturnValue(
        of({
          data: {
            qr_data: 'real-qr-data',
            qr_code_base64: 'real-base64',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await realTokenService.generateQRCode({
        orderId: 'order-1',
        amount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(result.qrData).toBe('real-qr-data');
      expect(realTokenHttpService.put).toHaveBeenCalled();
    });

    it('should handle error when Mercado Pago API fails', async () => {
      // Create a new service instance with real token
      const realTokenConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'MERCADO_PAGO_ACCESS_TOKEN') return 'real-token-123';
          if (key === 'ORDER_SERVICE_URL') return 'http://order-service:3001';
          return undefined;
        }),
      };

      const realTokenHttpService = {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };

      const realTokenModule = await Test.createTestingModule({
        providers: [
          PaymentService,
          {
            provide: 'PaymentPort',
            useValue: paymentPort,
          },
          {
            provide: HttpService,
            useValue: realTokenHttpService,
          },
          {
            provide: ConfigService,
            useValue: realTokenConfigService,
          },
        ],
      }).compile();

      const realTokenService = realTokenModule.get<PaymentService>(PaymentService);

      const paymentWithToken = new Payment(
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

      paymentPort.findByOrderId.mockResolvedValue(null);
      paymentPort.save.mockResolvedValueOnce(paymentWithToken); // createPayment succeeds
      realTokenHttpService.put.mockReturnValue(throwError(() => new Error('API Error')));

      await expect(
        realTokenService.generateQRCode({
          orderId: 'order-1',
          amount: 100.0,
          description: 'Test payment',
        }),
      ).rejects.toThrow(PaymentProcessingException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      paymentPort.findById.mockResolvedValue(mockPayment);

      const result = await service.getPaymentStatus('payment-1');

      expect(result).toBeDefined();
      expect(result.paymentId).toBe('payment-1');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw PaymentNotFoundException when payment does not exist', async () => {
      paymentPort.findById.mockResolvedValue(null);

      await expect(service.getPaymentStatus('payment-1')).rejects.toThrow(PaymentNotFoundException);
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return payment by order ID', async () => {
      paymentPort.findByOrderId.mockResolvedValue(mockPayment);

      const result = await service.getPaymentByOrderId('order-1');

      expect(result).toBe(mockPayment);
    });

    it('should throw PaymentNotFoundException when payment does not exist', async () => {
      paymentPort.findByOrderId.mockResolvedValue(null);

      await expect(service.getPaymentByOrderId('order-1')).rejects.toThrow(PaymentNotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const updatedPayment = new Payment(
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

      paymentPort.findById.mockResolvedValue(mockPayment);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      httpService.post.mockReturnValue(
        of({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      const result = await service.updatePaymentStatus('payment-1', PaymentStatus.APPROVED);

      expect(result).toBe(updatedPayment);
      expect(paymentPort.updateStatus).toHaveBeenCalledWith('payment-1', PaymentStatus.APPROVED);
    });

    it('should throw PaymentNotFoundException when payment does not exist', async () => {
      paymentPort.findById.mockResolvedValue(null);

      await expect(service.updatePaymentStatus('payment-1', PaymentStatus.APPROVED)).rejects.toThrow(
        PaymentNotFoundException,
      );
    });

    it('should notify order service with REJECTED status', async () => {
      const paymentPending = new Payment(
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

      const updatedPayment = new Payment(
        'payment-1',
        'order-1',
        100.0,
        'Test payment',
        PaymentStatus.REJECTED,
        PaymentMethod.QR_CODE,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      paymentPort.findById.mockResolvedValue(paymentPending);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      httpService.post.mockReturnValue(
        of({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      await service.updatePaymentStatus('payment-1', PaymentStatus.REJECTED);

      expect(httpService.post).toHaveBeenCalled();
      expect(paymentPort.updateStatus).toHaveBeenCalledWith('payment-1', PaymentStatus.REJECTED);
    });

    it('should notify order service with CANCELLED status', async () => {
      const paymentPending = new Payment(
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

      const updatedPayment = new Payment(
        'payment-1',
        'order-1',
        100.0,
        'Test payment',
        PaymentStatus.CANCELLED,
        PaymentMethod.QR_CODE,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      paymentPort.findById.mockResolvedValue(paymentPending);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      httpService.post.mockReturnValue(
        of({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      await service.updatePaymentStatus('payment-1', PaymentStatus.CANCELLED);

      expect(httpService.post).toHaveBeenCalled();
      expect(paymentPort.updateStatus).toHaveBeenCalledWith('payment-1', PaymentStatus.CANCELLED);
    });

    it('should notify order service with PENDING status', async () => {
      const paymentRejected = new Payment(
        'payment-1',
        'order-1',
        100.0,
        'Test payment',
        PaymentStatus.REJECTED,
        PaymentMethod.QR_CODE,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      const updatedPayment = new Payment(
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

      paymentPort.findById.mockResolvedValue(paymentRejected);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      httpService.post.mockReturnValue(
        of({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      await service.updatePaymentStatus('payment-1', PaymentStatus.PENDING);

      expect(httpService.post).toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('should process webhook successfully', async () => {
      // Payment must be in PENDING status to transition to APPROVED
      const paymentPending = new Payment(
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

      const updatedPayment = new Payment(
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

      paymentPort.findByExternalPaymentId.mockResolvedValue(paymentPending);
      // updatePaymentStatus calls findById internally, so we need to mock it
      paymentPort.findById.mockResolvedValue(paymentPending);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      httpService.post.mockReturnValue(
        of({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} as any }),
      );

      await service.processWebhook('external-payment-1', 'approved');

      expect(paymentPort.findByExternalPaymentId).toHaveBeenCalledWith('external-payment-1');
      expect(paymentPort.updateStatus).toHaveBeenCalled();
    });

    it('should handle payment not found gracefully', async () => {
      paymentPort.findByExternalPaymentId.mockResolvedValue(null);

      await service.processWebhook('external-payment-1', 'approved');

      expect(paymentPort.findByExternalPaymentId).toHaveBeenCalledWith('external-payment-1');
    });

    it('should handle error when notifying order service', async () => {
      const paymentPending = new Payment(
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

      const updatedPayment = new Payment(
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

      paymentPort.findByExternalPaymentId.mockResolvedValue(paymentPending);
      paymentPort.findById.mockResolvedValue(paymentPending);
      paymentPort.updateStatus.mockResolvedValue(updatedPayment);
      // Mock HTTP error
      httpService.post.mockReturnValue(throwError(() => new Error('Network error')));

      await service.processWebhook('external-payment-1', 'approved');

      // Should not throw error even if order service notification fails
      expect(paymentPort.updateStatus).toHaveBeenCalled();
    });
  });
});

