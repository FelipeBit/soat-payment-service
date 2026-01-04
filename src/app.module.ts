import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PaymentModule } from './infrastructure/modules/payment.module';
import { WebhookModule } from './infrastructure/modules/webhook.module';
import { HealthController } from './infrastructure/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get(
          'MONGODB_URI',
          'mongodb://localhost:27017/payment_db',
        );

        // For AWS DocumentDB, ensure TLS and replicaSet parameters are included
        const options: any = {};

        if (uri.includes('docdb') || uri.includes('tls=true')) {
          // DocumentDB requires TLS and specific connection options
          options.tls = true;
          options.tlsAllowInvalidCertificates = true; // DocumentDB uses self-signed certificates
        }

        return {
          uri,
          ...options,
        };
      },
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    PaymentModule,
    WebhookModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
