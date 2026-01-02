import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentPort } from '../../domain/ports/payment.port';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { PaymentSchema, PaymentDocument } from './database/schemas/payment.schema';

@Injectable()
export class PaymentAdapter implements PaymentPort {
  constructor(
    @InjectModel(PaymentSchema.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const paymentDoc = new this.paymentModel({
      id: payment.getId(),
      orderId: payment.getOrderId(),
      amount: payment.getAmount(),
      description: payment.getDescription(),
      status: payment.getStatus(),
      paymentMethod: payment.getPaymentMethod(),
      externalPaymentId: payment.getExternalPaymentId(),
      qrCodeData: payment.getQrCodeData(),
      qrCodeBase64: payment.getQrCodeBase64(),
      createdAt: payment.getCreatedAt(),
      updatedAt: payment.getUpdatedAt(),
    });

    const savedDoc = await paymentDoc.save();
    return this.toDomain(savedDoc);
  }

  async findById(id: string): Promise<Payment | null> {
    const doc = await this.paymentModel.findOne({ id }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const doc = await this.paymentModel.findOne({ orderId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByExternalPaymentId(externalPaymentId: string): Promise<Payment | null> {
    const doc = await this.paymentModel.findOne({ externalPaymentId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const docs = await this.paymentModel.find({ status }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const doc = await this.paymentModel
      .findOneAndUpdate(
        { id },
        { status, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    return this.toDomain(doc);
  }

  private toDomain(doc: PaymentDocument): Payment {
    return new Payment(
      doc.id,
      doc.orderId,
      doc.amount,
      doc.description,
      doc.status,
      doc.paymentMethod,
      doc.externalPaymentId,
      doc.qrCodeData,
      doc.qrCodeBase64,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}

