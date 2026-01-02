export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  QR_CODE = 'QR_CODE',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
}

export class Payment {
  constructor(
    private readonly id: string,
    private readonly orderId: string,
    private readonly amount: number,
    private readonly description: string,
    private status: PaymentStatus,
    private readonly paymentMethod: PaymentMethod,
    private externalPaymentId: string | null,
    private qrCodeData: string | null,
    private qrCodeBase64: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getAmount(): number {
    return this.amount;
  }

  getDescription(): string {
    return this.description;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  getPaymentMethod(): PaymentMethod {
    return this.paymentMethod;
  }

  getExternalPaymentId(): string | null {
    return this.externalPaymentId;
  }

  getQrCodeData(): string | null {
    return this.qrCodeData;
  }

  getQrCodeBase64(): string | null {
    return this.qrCodeBase64;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateStatus(newStatus: PaymentStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  setExternalPaymentId(externalId: string): void {
    this.externalPaymentId = externalId;
    this.updatedAt = new Date();
  }

  setQrCode(qrCodeData: string, qrCodeBase64: string): void {
    this.qrCodeData = qrCodeData;
    this.qrCodeBase64 = qrCodeBase64;
    this.updatedAt = new Date();
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === PaymentStatus.APPROVED;
  }

  canBeRefunded(): boolean {
    return this.status === PaymentStatus.APPROVED;
  }
}

