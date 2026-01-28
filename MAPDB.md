# MAPDB - Mapeamento de Mudanças no Banco de Dados

## 2026-01-28 - Adição de Permissão 'accessPacotes'

**Tabela Alvo:** `Tier`

**Mudança:**
- Adicionada coluna `accessPacotes` (Boolean) com valor padrão `false`.

**Motivo:**
- Permitir controle granular de acesso ao módulo "Gestão de Pacotes" através do sistema de Tiers, conforme solicitado pelo administrador.
- Usuários com `accessPacotes = true` poderão visualizar a aba Pacotes e gerenciar (criar/editar/excluir) pacotes e ver todos os pedidos vinculados.

**Rotas Protegidas:**
- `GET /api/client-packages` (Listagem Global)
- `GET /api/client-packages/all/orders` (Painel Universal de Pedidos)
- `POST /api/client-packages` (Criação)
- `PUT /api/client-packages/:id` (Edição)
- `DELETE /api/client-packages/:id` (Exclusão)
