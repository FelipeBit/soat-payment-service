import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PaymentStatus, PaymentMethod } from '../../../../domain/entities/payment.entity';

export type PaymentDocument = PaymentSchema & Document;

@Schema({ timestamps: true, collection: 'payments' })
export class PaymentSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ default: null, index: true })
  externalPaymentId: string | null;

  @Prop({ default: null })
  qrCodeData: string | null;

  @Prop({ default: null })
  qrCodeBase64: string | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PaymentSchemaFactory = SchemaFactory.createForClass(PaymentSchema);

// Create indexes
PaymentSchemaFactory.index({ orderId: 1 });
PaymentSchemaFactory.index({ externalPaymentId: 1 });
PaymentSchemaFactory.index({ status: 1 });

