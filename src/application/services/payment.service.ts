import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';
import { PaymentPort } from '../../domain/ports/payment.port';
import { Payment, PaymentStatus, PaymentMethod } from '../../domain/entities/payment.entity';
import {
  PaymentNotFoundException,
  PaymentAlreadyExistsException,
  PaymentProcessingException,
} from '../../domain/exceptions/payment.exception';

export interface CreatePaymentDto {
  orderId: string;
  amount: number;
  description: string;
  paymentMethod?: PaymentMethod;
}

export interface QRCodeResponse {
  paymentId: string;
  orderId: string;
  qrData: string;
  qrCodeBase64: string;
  amount: number;
  status: PaymentStatus;
}

@Injectable()
export class PaymentService {
  private readonly mercadoPagoAccessToken: string;
  private readonly mercadoPagoBaseUrl = 'https://api.mercadopago.com';
  private readonly orderServiceUrl: string;

  constructor(
    @Inject('PaymentPort')
    private readonly paymentPort: PaymentPort,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mercadoPagoAccessToken = this.configService.get('MERCADO_PAGO_ACCESS_TOKEN', 'test-token');
    this.orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://order-service:3001');
  }

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    // Check if payment already exists for this order
    const existingPayment = await this.paymentPort.findByOrderId(dto.orderId);
    if (existingPayment) {
      throw new PaymentAlreadyExistsException();
    }

    const payment = new Payment(
      uuidv4(),
      dto.orderId,
      dto.amount,
      dto.description,
      PaymentStatus.PENDING,
      dto.paymentMethod || PaymentMethod.QR_CODE,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );

    return this.paymentPort.save(payment);
  }

  async generateQRCode(dto: CreatePaymentDto): Promise<QRCodeResponse> {
    // Check if payment already exists
    let payment = await this.paymentPort.findByOrderId(dto.orderId);
    
    if (!payment) {
      payment = await this.createPayment(dto);
    }

    try {
      // Generate QR Code via Mercado Pago (or mock for development)
      const qrCodeData = await this.generateMercadoPagoQRCode(
        payment.getId(),
        dto.orderId,
        dto.amount,
        dto.description,
      );

      // Update payment with QR Code data
      payment.setQrCode(qrCodeData.qr_data, qrCodeData.qr_code_base64);
      
      // For simplicity, we'll save the updated payment
      // In a real scenario, you'd have an update method
      await this.paymentPort.save(payment);

      return {
        paymentId: payment.getId(),
        orderId: dto.orderId,
        qrData: qrCodeData.qr_data,
        qrCodeBase64: qrCodeData.qr_code_base64,
        amount: dto.amount,
        status: payment.getStatus(),
      };
    } catch (error) {
      throw new PaymentProcessingException(error.message);
    }
  }

  private async generateMercadoPagoQRCode(
    paymentId: string,
    orderId: string,
    amount: number,
    description: string,
  ): Promise<{ qr_data: string; qr_code_base64: string }> {
    // For development/testing, return mock data
    if (this.mercadoPagoAccessToken === 'test-token') {
      return {
        qr_data: `00020126580014br.gov.bcb.pix0136${paymentId}5204000053039865406${amount.toFixed(2)}5802BR5913FastFood API6008SAOPAULO62070503***6304`,
        qr_code_base64: Buffer.from(`MOCK_QR_CODE_${orderId}_${amount}`).toString('base64'),
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.mercadoPagoBaseUrl}/instore/orders/qr/seller/collectors/external_pos_id/qrs`,
          {
            external_reference: orderId,
            title: `Pedido ${orderId}`,
            description,
            total_amount: amount,
          },
          {
            headers: {
              Authorization: `Bearer ${this.mercadoPagoAccessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        qr_data: response.data.qr_data,
        qr_code_base64: response.data.qr_code_base64,
      };
    } catch (error) {
      console.error('Error generating QR Code:', error);
      throw new Error('Failed to generate QR Code');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ paymentId: string; status: PaymentStatus; orderId: string }> {
    const payment = await this.paymentPort.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundException();
    }

    return {
      paymentId: payment.getId(),
      status: payment.getStatus(),
      orderId: payment.getOrderId(),
    };
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentPort.findByOrderId(orderId);
    if (!payment) {
      throw new PaymentNotFoundException();
    }
    return payment;
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<Payment> {
    const payment = await this.paymentPort.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundException();
    }

    const updatedPayment = await this.paymentPort.updateStatus(paymentId, status);

    // Notify Order Service about payment status change
    await this.notifyOrderService(payment.getOrderId(), status);

    return updatedPayment;
  }

  async processWebhook(externalPaymentId: string, status: string): Promise<void> {
    const payment = await this.paymentPort.findByExternalPaymentId(externalPaymentId);
    
    if (!payment) {
      console.warn(`Payment not found for external ID: ${externalPaymentId}`);
      return;
    }

    const paymentStatus = this.mapExternalStatusToInternal(status);
    await this.updatePaymentStatus(payment.getId(), paymentStatus);
  }

  private mapExternalStatusToInternal(externalStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      approved: PaymentStatus.APPROVED,
      pending: PaymentStatus.PENDING,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      in_process: PaymentStatus.PROCESSING,
    };

    return statusMap[externalStatus] || PaymentStatus.PENDING;
  }

  private async notifyOrderService(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    try {
      // Map payment status to order payment status
      const orderPaymentStatus = paymentStatus === PaymentStatus.APPROVED ? 'APPROVED' : 
                                  paymentStatus === PaymentStatus.REJECTED ? 'REJECTED' :
                                  paymentStatus === PaymentStatus.CANCELLED ? 'CANCELLED' : 'PENDING';

      await firstValueFrom(
        this.httpService.post(`${this.orderServiceUrl}/orders/${orderId}/payment-status`, {
          paymentStatus: orderPaymentStatus,
        }),
      );
      
      console.log(`Order service notified: order ${orderId}, status ${orderPaymentStatus}`);
    } catch (error) {
      console.error('Failed to notify order service:', error.message);
      // Don't fail the payment update if order service notification fails
    }
  }
}

