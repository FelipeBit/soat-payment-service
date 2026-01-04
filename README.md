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
MONGODB_URI=mongodb://username:password@docdb-cluster-endpoint.cluster-xxxxx.docdb.amazonaws.com:27017/payment_db?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&authMechanism=SCRAM-SHA-1
MERCADO_PAGO_ACCESS_TOKEN=your-token
ORDER_SERVICE_URL=http://internal-k8s-soatalb-36c7e2e1c7-1844691046.us-east-1.elb.amazonaws.com
```

**⚠️ IMPORTANTE sobre ORDER_SERVICE_URL:**
- Para **EKS/Kubernetes**, use o ALB consolidado interno: `http://internal-k8s-soatalb-36c7e2e1c7-1844691046.us-east-1.elb.amazonaws.com`
- Alternativamente, pode usar o formato Kubernetes Service: `http://order-service.order.svc.cluster.local:3001` (apenas dentro do cluster)

### Para Desenvolvimento Local

```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/payment_db
MERCADO_PAGO_ACCESS_TOKEN=your-token
ORDER_SERVICE_URL=http://localhost:3001
```

**Nota:** Veja o arquivo `.env.example` para mais detalhes.

## 📖 API Endpoints

- `POST /payments` - Criar pagamento
- `POST /payments/qr-code` - Gerar QR Code
- `GET /payments/:id` - Status do pagamento
- `GET /payments/order/:orderId` - Pagamento por pedido
- `POST /webhooks/payment` - Webhook do Mercado Pago
- `POST /webhooks/mock/approve/:orderId` - Mock endpoint para aprovar pagamento (apenas para testes)

## 📚 Documentação Swagger

Acesse: http://localhost:3002/api

## 🚀 CI/CD

Este serviço possui CI/CD configurado via GitHub Actions que:
- Executa testes com cobertura
- Executa análise de qualidade de código (ESLint + TypeScript + npm audit)
- Faz build e push da imagem Docker para ECR
- **Deploy manual via workflow_dispatch** (não permite push direto para staging/main)

### Análise de Código

O projeto usa ferramentas gratuitas e nativas:
- **ESLint** - Análise de qualidade e padrões de código
- **TypeScript** - Verificação de tipos
- **npm audit** - Verificação de vulnerabilidades em dependências

## 🔗 Dependências

- Order Service (HTTP)

