# Payment Service

Microsserviço responsável por processar pagamentos e gerenciar webhooks do Mercado Pago.

## 📋 Responsabilidades

- Geração de QR Code para pagamento
- Processamento de pagamentos
- Recebimento de webhooks do Mercado Pago
- Atualização de status de pagamento
- Notificação ao Order Service sobre status de pagamento

## 🗄️ Banco de Dados

- **Tipo:** MongoDB (NoSQL)
- **Database:** `payment_db`
- **ORM:** Mongoose

## 🚀 Como Executar

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar
npm run start:dev
```

### Docker

```bash
docker-compose up payment-service
```

## 📝 Variáveis de Ambiente

### Para AWS DocumentDB (Produção/Staging)

```env
PORT=3002
NODE_ENV=production
MONGODB_URI=mongodb://username:password@docdb-cluster-endpoint.cluster-xxxxx.docdb.amazonaws.com:27017/payment_db?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
MERCADO_PAGO_ACCESS_TOKEN=your-token
ORDER_SERVICE_URL=http://order-service:3001
```

### Para Desenvolvimento Local

```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/payment_db
MERCADO_PAGO_ACCESS_TOKEN=your-token
ORDER_SERVICE_URL=http://order-service:3001
```

**Nota:** Veja o arquivo `.env.example` para mais detalhes.

## 📖 API Endpoints

- `POST /payments` - Criar pagamento
- `POST /payments/qr-code` - Gerar QR Code
- `GET /payments/:id` - Status do pagamento
- `GET /payments/order/:orderId` - Pagamento por pedido
- `POST /webhooks/payment` - Webhook do Mercado Pago

## 📚 Documentação Swagger

Acesse: http://localhost:3002/api

## 🔗 Dependências

- Order Service (HTTP)

