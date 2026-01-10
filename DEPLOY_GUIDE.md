# Guia de Deploy - CRM Pontocom Audio via EasyPanel

Este guia fornece os passos definitivos para hospedar o CRM no EasyPanel sob o domínio **https://crm.pontocomaudio.net**.

## Pré-requisitos
1.  **EasyPanel** com funcionalidade "Docker Compose via Git".
2.  **PostgreSQL externo** acessível.
3.  Acesso ao repositório Git com a branch `master` atualizada.

## Como Funciona a Arquitetura (Single Entry Point)
Para simplificar sua vida, configuramos o Frontend para funcionar como um "Proxy Reverso".
- **Um só Domínio**: Você só precisa configurar `https://crm.pontocomaudio.net`.
- O Frontend (Porta 80) recebe tudo.
- Se for uma página, ele exibe o React.
- Se for uma chamada de API (`/api/...`), ele repassa internamente para o Backend.

## Configuração no EasyPanel

### 1. Criar Projeto (Docker Compose via Git)
- Em "Projects", crie um projeto do tipo **"Docker Compose"**.
- Conecte seu GitHub e selecione a branch `master`.
- O EasyPanel vai ler o `docker-compose.yml` e subir dois containers (`frontend` e `backend`).

### 2. Configurar Variáveis de Ambiente
No dashboard do projeto, vá em **"Environment"** e adicione:
- `DATABASE_URL`: URL do seu banco PostgreSQL (ex: `postgresql://user:pass@host:5432/db`).
- `JWT_SECRET`: Sua chave secreta.

> [!NOTE]
> Não é mais necessário configurar `VITE_API_URL`. O sistema já sabe que deve conversar internamente.

### 3. Configurar Domínio (Apenas UM!)
- Vá no serviço **frontend** > **Domains**.
- Adicione `crm.pontocomaudio.net`.
- Porta: `80`.

**Não precisa adicionar domínio para o backend.** Ele ficará protegido na rede interna, recebendo requisições apenas do frontend.

### 4. Executar Migrações
Abra o console do serviço **backend** e rode:
```bash
npx prisma migrate deploy
node seedAdmin.js
```

---
*Atualizado em 10/01/2026 - Arquitetura Unificada*
