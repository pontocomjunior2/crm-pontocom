# Guia de Deploy - CRM Pontocom Audio via EasyPanel

Este guia fornece os passos necessários para hospedar o CRM no EasyPanel sob o domínio **https://crm.pontocomaudio.net**.

## Pré-requisitos
1.  Servidor com **EasyPanel** instalado.
2.  Acesso ao repositório Git (GitHub/GitLab) com a branch `master` atualizada.
3.  Domínio `crm.pontocomaudio.net` apontado para o IP do seu servidor (DNS A Record).

## Configuração no EasyPanel

### 1. Criar novo Projeto
- No dashboard do EasyPanel, clique em **"Create New Project"** e dê o nome de `crm-pontocom`.

### 2. Adicionar os Serviços (via Docker Compose)
O EasyPanel permite importar toda a stack de uma vez:
- Dentro do projeto, clique em **"Services"** -> **"Create Service"** -> **"App from Docker Compose"**.
- Cole o conteúdo do arquivo `docker-compose.yml` que está na raiz do projeto.
- O EasyPanel irá identificar os 3 serviços: `db`, `backend` e `frontend`.

### 3. Configurar Variáveis de Ambiente
No serviço **backend**, configure as seguintes variáveis em **"Environment"**:
- `DATABASE_URL`: `postgresql://postgres:postgres@db:5432/crm_db?schema=public` (ou conforme alterado no Compose).
- `JWT_SECRET`: Uma chave aleatória e segura para os tokens (ex: `junior_pontocom_2026_super_secret`).
- `PORT`: `3001`.

### 4. Configurar Domínios
- **Frontend**: No serviço `frontend`, vá em **"Domains"** e adicione `crm.pontocomaudio.net`. Certifique-se de que a porta de destino seja `80`.
- **Backend**: No serviço `backend`, adicione um subdomínio (ex: `api-crm.pontocomaudio.net`) ou use o domínio interno do EasyPanel se não precisar de acesso externo direto à API (o frontend já está configurado para falar com `http://localhost:3001/api` no dev, mas no build deve usar a URL de produção).

> [!IMPORTANT]
> **Ajuste da URL da API**: No arquivo `frontend/src/services/api.js`, certifique-se de que a `API_BASE_URL` aponte para a URL de produção do seu backend (ex: `https://api-crm.pontocomaudio.net/api`).

### 5. Executar Migrações e Seed
Após o primeiro deploy do backend:
- Vá no console do serviço **backend** e execute:
  ```bash
  npx prisma migrate deploy
  node seedAdmin.js
  ```
- Isso criará as tabelas do banco e o usuário administrador padrão (`junior@pontocomaudio.net`).

## Notas Adicionais
- **Certificado SSL**: O EasyPanel gerencia o Let's Encrypt automaticamente ao adicionar o domínio.
- **Persistência**: O volume `postgres_data` garante que seus dados não sejam perdidos ao reiniciar o container do banco.
