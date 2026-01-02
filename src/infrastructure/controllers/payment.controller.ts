import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from '../../application/services/payment.service';
import { PaymentStatus } from '../../domain/entities/payment.entity';
import { CreatePaymentDto, GenerateQRCodeDto } from './dtos/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
@UsePipes(new ValidationPipe({ transform: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    const payment = await this.paymentService.createPayment(createPaymentDto);
    return {
      id: payment.getId(),
      orderId: payment.getOrderId(),
      amount: payment.getAmount(),
      status: payment.getStatus(),
      paymentMethod: payment.getPaymentMethod(),
      createdAt: payment.getCreatedAt(),
    };
  }

  @Post('qr-code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate QR Code for payment' })
  @ApiBody({ type: GenerateQRCodeDto })
  @ApiResponse({ status: 201, description: 'QR Code generated successfully' })
  async generateQRCode(@Body() generateQRCodeDto: GenerateQRCodeDto) {
    const result = await this.paymentService.generateQRCode({
      orderId: generateQRCodeDto.orderId,
      amount: generateQRCodeDto.totalAmount,
      description: generateQRCodeDto.description,
    });

    return {
      paymentId: result.paymentId,
      orderId: result.orderId,
      qrData: result.qrData,
      qrCodeBase64: result.qrCodeBase64,
      totalAmount: result.amount,
      status: result.status,
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: String })
  async getPaymentById(@Param('id') id: string) {
    const result = await this.paymentService.getPaymentStatus(id);
    return result;
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payment by order ID' })
  @ApiParam({ name: 'orderId', type: String })
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    return {
      id: payment.getId(),
      orderId: payment.getOrderId(),
      amount: payment.getAmount(),
      status: payment.getStatus(),
      paymentMethod: payment.getPaymentMethod(),
      qrData: payment.getQrCodeData(),
      createdAt: payment.getCreatedAt(),
    };
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', type: String })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() body: { status: PaymentStatus },
  ) {
    const payment = await this.paymentService.updatePaymentStatus(id, body.status);
    return {
      id: payment.getId(),
      orderId: payment.getOrderId(),
      status: payment.getStatus(),
      updatedAt: payment.getUpdatedAt(),
    };
  }
}

