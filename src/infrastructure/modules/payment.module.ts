import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../../application/services/payment.service';
import { PaymentAdapter } from '../adapters/payment.adapter';
import { PaymentSchema, PaymentSchemaFactory } from '../adapters/database/schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentSchema.name, schema: PaymentSchemaFactory },
    ]),
    HttpModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'PaymentPort',
      useClass: PaymentAdapter,
    },
  ],
  exports: [PaymentService, 'PaymentPort'],
})
export class PaymentModule {}

