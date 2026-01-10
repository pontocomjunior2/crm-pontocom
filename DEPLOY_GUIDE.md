# Guia de Deploy - CRM Pontocom Audio via EasyPanel

Este guia fornece os passos definitivos para hospedar o CRM no EasyPanel sob o domínio **https://crm.pontocomaudio.net**.

## Pré-requisitos
1.  Servidor com **EasyPanel** instalado.
2.  **PostgreSQL externo** acessível.
3.  Acesso ao repositório Git com a branch `master` atualizada.

## Configuração no EasyPanel (Recomendado)

Para evitar erros de contexto de build, a forma mais robusta no EasyPanel é criar um projeto do tipo **"Docker Compose"** apontando para o seu repositório Git.

### 1. Criar novo Projeto
- Clique em **"Projects"** -> **"Create Project"**.
- Escolha o tipo **"Docker Compose"**.
- Conecte seu repositório GitHub e selecione a branch `master`.

### 2. Configurar Variáveis de Ambiente
No dashboard do projeto no EasyPanel, vá em **"Environment"** e adicione:
- `DATABASE_URL`: A string de conexão do seu banco externo.
- `JWT_SECRET`: Uma chave secreta forte.
- `VITE_API_URL`: `https://api-crm.pontocomaudio.net/api` (ajuste se for outro domínio).
- `VITE_STORAGE_URL`: `https://api-crm.pontocomaudio.net`

### 3. Configurar os Domínios (Urls Públicas)
O EasyPanel cria serviços separados para **frontend** e **backend**. Você precisa configurar o domínio de cada um:

#### A. Serviço `backend`
1.  Clique no serviço **backend**.
2.  Vá em **Domains**.
3.  Adicione um domínio (pode usar o provisório do EasyPanel ou um personalizado como `api-crm.pontocomaudio.net`).
4.  **Importante**: Certifique-se de que ele está apontando para a porta `3001` (Interna).
5.  Copie a URL completa gerada (ex: `https://backend-xyz.easypanel.host`).

#### B. Serviço `frontend`
1.  Clique no serviço **frontend**.
2.  Vá em **Domains**.
3.  Adicione seu domínio principal (ex: `crm.pontocomaudio.net` ou o provisório).
4.  Verifique se está apontando para a porta `80` (Interna).
    - *Se o EasyPanel criou um target estranho como `pontocom_crm-pontocom:80`, tente mudar para `http://frontend:80` ou apenas porta `80` se a opção estiver disponível.*

### 4. Conectar Frontend ao Backend (Environment)
O Frontend precisa saber onde o Backend está.
1.  Ainda no serviço **frontend**, vá em **Environment**.
2.  Adicione/Edite a variável `VITE_API_URL`.
3.  Valor: A URL do backend que você copiou no passo 3A, adicionando `/api` no final.
    - Exemplo: `https://backend-xyz.easypanel.host/api`
4.  Clique em **"Save & Deploy"** para o frontend reconstruir com a nova URL.
```bash
npx prisma migrate deploy
node seedAdmin.js
```

## Solução de Erro "Path not found"
Se você recebeu este erro, é porque o EasyPanel tentou rodar o Compose sem baixar os arquivos do Git primeiro. Usando a opção de projeto **"Docker Compose (Git)"** descrita acima, os arquivos serão baixados automaticamente no lugar certo.

---
*Atualizado em 10/01/2026*
