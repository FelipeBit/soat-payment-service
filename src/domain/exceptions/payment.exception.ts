import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentNotFoundException extends HttpException {
  constructor() {
    super('Payment not found', HttpStatus.NOT_FOUND);
  }
}

export class PaymentAlreadyExistsException extends HttpException {
  constructor() {
    super('Payment already exists for this order', HttpStatus.CONFLICT);
  }
}

export class InvalidPaymentStatusException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class PaymentProcessingException extends HttpException {
  constructor(message: string) {
    super(`Payment processing error: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

