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

### 3. Ajuste de Domínios
- Vá no serviço **frontend** -> **Domains** e adicione `crm.pontocomaudio.net`.
- No serviço **backend**, se precisar de acesso direto, adicione `api-crm.pontocomaudio.net`.

### 4. Executar Migrações e Admin Seed
Abra o console do serviço **backend** e rode:
```bash
npx prisma migrate deploy
node seedAdmin.js
```

## Solução de Erro "Path not found"
Se você recebeu este erro, é porque o EasyPanel tentou rodar o Compose sem baixar os arquivos do Git primeiro. Usando a opção de projeto **"Docker Compose (Git)"** descrita acima, os arquivos serão baixados automaticamente no lugar certo.

---
*Atualizado em 10/01/2026*
