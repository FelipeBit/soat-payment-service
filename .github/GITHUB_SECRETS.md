# GitHub Secrets - Payment Service

Este documento lista todos os secrets que precisam ser configurados no repositório do GitHub para o CI/CD funcionar.

## 📍 Como Configurar

1. Acesse o repositório no GitHub
2. Vá em **Settings > Secrets and variables > Actions**
3. Clique em **New repository secret**
4. Adicione cada secret abaixo

---

## 🔴 Obrigatórios

### AWS Credentials
Esses secrets são **obrigatórios** para build, push e deploy.

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `AWS_ACCESS_KEY_ID` | Access Key ID da AWS | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key da AWS | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

### Application Secrets
Esses secrets são **obrigatórios** para a aplicação funcionar corretamente no EKS.

| Secret | Descrição | Formato | Exemplo |
|--------|-----------|---------|---------|
| `MONGODB_URI` | Connection string do MongoDB/DocumentDB | `mongodb://user:pass@host:port/db?tls=true&replicaSet=rs0` | `mongodb://admin:senha@docdb-cluster.cluster-xxxxx.docdb.amazonaws.com:27017/payment_db?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago | String | `APP_USR-1234567890-abcdefghijklmnopqrstuvwxyz-12345678` |
| `ORDER_SERVICE_URL` | URL do serviço de pedidos | URL HTTP | `http://order-service.order.svc.cluster.local:3001` |

**⚠️ IMPORTANTE sobre MONGODB_URI:**
- Para **AWS DocumentDB**, deve incluir `tls=true&replicaSet=rs0`
- Formato completo: `mongodb://[user]:[password]@[host]:[port]/[database]?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
- Para **MongoDB local** (desenvolvimento): `mongodb://localhost:27017/payment_db`

**Permissões necessárias na AWS:**
- ECR: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:CreateRepository`, `ecr:DescribeRepositories`
- EKS: `eks:DescribeCluster`, `eks:ListClusters`, `eks:UpdateKubeconfig` (para autenticação kubectl)
- IAM: `sts:GetCallerIdentity` (para autenticação)
- **IMPORTANTE**: O usuário IAM também precisa ter acesso ao cluster EKS via `aws-auth` ConfigMap no Kubernetes

---

## 🟡 Opcionais (com valores padrão)

Esses secrets têm valores padrão, mas podem ser customizados se necessário.

| Secret | Descrição | Valor Padrão | Quando Usar |
|--------|-----------|--------------|-------------|
| `ORDER_SERVICE_URL` | URL do serviço de pedidos | `http://order-service.order.svc.cluster.local:3001` | Se o serviço estiver em outro namespace ou URL |

---

## 🟢 Automáticos (não precisam ser configurados)

Esses secrets são fornecidos automaticamente pelo GitHub:

- `GITHUB_TOKEN` - Token automático para ações do GitHub

---

## 📋 Resumo Rápido

### Mínimo necessário para funcionar:
```
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ MONGODB_URI (com tls=true&replicaSet=rs0 para DocumentDB)
✅ MERCADO_PAGO_ACCESS_TOKEN
```

### Recomendado (para comunicação entre serviços):
```
✅ ORDER_SERVICE_URL
```

---

## 🔐 Como Obter as Credenciais AWS

### 1. Criar IAM User

1. Acesse o **IAM Console** na AWS
2. Vá em **Users > Add users**
3. Nome: `github-actions-payment-service`
4. Selecione **Access key - Programmatic access**
5. Clique em **Next: Permissions**

### 2. Anexar Políticas

Anexe as seguintes políticas (ou crie uma política customizada):

**Política ECR:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:CreateRepository",
        "ecr:DescribeRepositories"
      ],
      "Resource": "*"
    }
  ]
}
```

**Política EKS:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Criar Access Key

1. Após criar o usuário, vá em **Security credentials**
2. Clique em **Create access key**
3. Escolha **Command Line Interface (CLI)**
4. Copie o **Access Key ID** e **Secret Access Key**
5. Adicione como secrets no GitHub

---

## 🔑 Como Obter o Token do Mercado Pago

1. Acesse o [Painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Suas integrações**
3. Selecione sua aplicação
4. Vá em **Credenciais**
5. Copie o **Access Token** (Production ou Test)
6. Adicione como secret `MERCADO_PAGO_ACCESS_TOKEN` no GitHub

---

## ✅ Verificação

Após configurar os secrets, você pode verificar se estão corretos:

1. Faça um push para a branch `staging` ou `main`
2. Vá em **Actions** no GitHub
3. Veja se o workflow executa sem erros de autenticação

---

## 🔄 Atualizar Secrets

Para atualizar um secret:

1. Vá em **Settings > Secrets and variables > Actions**
2. Clique no secret que deseja atualizar
3. Clique em **Update**
4. Cole o novo valor
5. Salve

---

## 🚨 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite secrets no código
- Use sempre GitHub Secrets para valores sensíveis
- Rotacione as credenciais AWS periodicamente
- Use o princípio do menor privilégio nas políticas IAM
- Revise as permissões regularmente
- Mantenha o token do Mercado Pago seguro e não compartilhe

