# Guia de Deploy - CRM Pontocom Audio via EasyPanel

Este guia fornece os passos necessários para hospedar o CRM no EasyPanel sob o domínio **https://crm.pontocomaudio.net**.

## Pré-requisitos
1.  Servidor com **EasyPanel** instalado.
2.  **PostgreSQL externo já configurado** e acessível.
3.  Acesso ao repositório Git com a branch `master` atualizada.
4.  Domínio `crm.pontocomaudio.net` apontado para o IP do seu servidor.

## Configuração no EasyPanel

### 1. Criar novo Projeto
- No dashboard do EasyPanel, clique em **"Create New Project"** e dê o nome de `crm-pontocom`.

### 2. Adicionar os Serviços (via Docker Compose)
- Clique em **"Services"** -> **"Create Service"** -> **"App from Docker Compose"**.
- Cole o conteúdo do arquivo `docker-compose.yml` atualizado (sem o serviço de banco interno).
- O EasyPanel irá identificar os serviços: `backend` e `frontend`.

### 3. Configurar Variáveis de Ambiente
No serviço **backend**, configure em **"Environment"**:
- `DATABASE_URL`: A URL de conexão com seu PostgreSQL externo (ex: `postgresql://user:pass@host:5432/db`).
- `JWT_SECRET`: Uma chave aleatória e segura para os tokens.
- `PORT`: `3001`.

### 4. Configurar Domínios
- **Frontend**: No serviço `frontend`, adicione `crm.pontocomaudio.net` (Porta 80).
- **Backend**: Configure um subdomínio (ex: `api-crm.pontocomaudio.net`) ou use o link de serviço interno do EasyPanel.

> [!IMPORTANT]
> **Ajuste da URL da API**: No arquivo `frontend/src/services/api.js`, certifique-se de que a `API_BASE_URL` aponte para a URL de produção do seu backend.

### 5. Executar Migrações e Seed
No console do serviço **backend**:
```bash
npx prisma migrate deploy
node seedAdmin.js
```

## Notas Adicionais
- Como o banco é externo, certifique-se de que o servidor do EasyPanel tem permissão de rede para acessar o host do PostgreSQL.
- O SSL será gerenciado automaticamente pelo EasyPanel.
