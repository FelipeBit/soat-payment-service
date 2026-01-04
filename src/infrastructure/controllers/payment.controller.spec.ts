import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../../application/services/payment.service';
import { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

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
    const mockPaymentService = {
      createPayment: jest.fn(),
      generateQRCode: jest.fn(),
      getPaymentStatus: jest.fn(),
      getPaymentByOrderId: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      paymentService.createPayment.mockResolvedValue(mockPayment);

      const result = await controller.createPayment({
        orderId: 'order-1',
        amount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-1');
      expect(paymentService.createPayment).toHaveBeenCalled();
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      paymentService.generateQRCode.mockResolvedValue({
        paymentId: 'payment-1',
        orderId: 'order-1',
        qrData: 'qr-data',
        qrCodeBase64: 'base64-string',
        amount: 100.0,
        status: PaymentStatus.PENDING,
      });

      const result = await controller.generateQRCode({
        orderId: 'order-1',
        totalAmount: 100.0,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(result.paymentId).toBe('payment-1');
      expect(result.qrData).toBe('qr-data');
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by ID', async () => {
      paymentService.getPaymentStatus.mockResolvedValue({
        paymentId: 'payment-1',
        status: PaymentStatus.PENDING,
        orderId: 'order-1',
      });

      const result = await controller.getPaymentById('payment-1');

      expect(result).toBeDefined();
      expect(result.paymentId).toBe('payment-1');
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return payment by order ID', async () => {
      paymentService.getPaymentByOrderId.mockResolvedValue(mockPayment);

      const result = await controller.getPaymentByOrderId('order-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-1');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      paymentService.updatePaymentStatus.mockResolvedValue(mockPayment);

      const result = await controller.updatePaymentStatus('payment-1', { status: PaymentStatus.APPROVED });

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-1');
      expect(paymentService.updatePaymentStatus).toHaveBeenCalledWith('payment-1', PaymentStatus.APPROVED);
    });
  });
});

