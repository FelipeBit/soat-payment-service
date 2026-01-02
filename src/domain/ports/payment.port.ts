import { Payment, PaymentStatus } from '../entities/payment.entity';

export interface PaymentPort {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByExternalPaymentId(externalPaymentId: string): Promise<Payment | null>;
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment>;
}

