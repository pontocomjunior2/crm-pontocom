# MAPDB - Mapeamento de Mudanças no Banco de Dados

## 2026-01-28 - Adição de Permissão 'accessPacotes'

**Tabela Alvo:** `Tier`

**Mudança:**
- Adicionada coluna `accessPacotes` (Boolean) com valor padrão `false`.

**Motivo:**
- Permitir controle granular de acesso ao módulo "Gestão de Pacotes" através do sistema de Tiers.

**Rotas Protegidas:**
- `GET /api/client-packages` (Listagem Global)
- `GET /api/client-packages/all/orders` (Painel Universal de Pedidos)
- `POST /api/client-packages` (Criação)
- `PUT /api/client-packages/:id` (Edição)
- `DELETE /api/client-packages/:id` (Exclusão)

---

## 2026-02-03 - IDs de Consumo de Pacotes (PC-XXXX)

**Tabela Alvo:** `Order`

**Mudança:**
- Adicionada coluna `consumptionId` (String, Unique, Opcional).
- Adicionada coluna `packageName` (String, Opcional) para snapshot do nome do pacote no momento do pedido.

**Motivo:**
- Implementar a nova regra de ID para consumo de pacotes (ex: `PC-0001`), separando a lógica de IDs sequenciais de faturamento dos pedidos realizados dentro de um pacote.
- O campo `consumptionId` permite rastrear a ordem de consumo global de áudios de pacotes sem interferir no `numeroVenda` oficial.

**Conexões:**
- Vinculado ao `packageId`. Somente pedidos com pacote terão este ID gerado automaticamente.

---

## 2026-02-04 - Sistema de Serviços Recorrentes e Automáticos

**Tabelas Alvo:** `RecurringService`, `RecurringServiceLog`, `Client`

**Mudança:**
- Criada tabela `RecurringService` para armazenar contratos e serviços repetitivos.
- Criada tabela `RecurringServiceLog` para histórico de execuções automáticas.
- Adicionada relação `recurringServices` no modelo `Client`.
- Enums adicionais: `ServiceRecurrence` (WEEKLY, MONTHLY, etc.).

**Motivo:**
- Permitir faturamento automático de serviços que não são necessariamente áudios (contratos, assinaturas, manutenção).
- Configuração granular de comissão, faturamento automático e lançamento automático por serviço.

**Conexões:**
- `RecurringService` conecta-se ao `Client`.
- Quando executado, gera uma entrada na tabela `Order` com `status="VENDA"`.
- `RecurringServiceLog` mantém o rastreio da execução e o link para a `Order` gerada.
---

## 2026-02-04 - Diferenciação de Consumo (Venda vs Fornecedor)

**Tabela Alvo:** `Order`

**Mudança:**
- Adicionada coluna `creditsConsumedSupplier` (Int, Default: 0).

**Motivo:**
- Permitir que um único pedido consuma quantidades diferentes de créditos do cliente (venda) e do pacote de créditos do fornecedor (custo).
- Útil para casos onde a precificação/unidade de medida difere entre a negociação com o cliente e com o locutor/fornecedor.

**Conexões:**
- `creditsConsumed` continua sendo o valor debitado do `ClientPackage`.
- `creditsConsumedSupplier` passa a ser a base para o cálculo de `cacheValor` automático e deduções de saldo de fornecedores (se implementado futuramente).

---

## 2026-02-06 - Controle de Comissões por Pedido

**Tabela Alvo:** `Order`

**Mudança:**
- Adicionada coluna `hasCommission` (Boolean, default: `false`).

**Motivo:**
- Permitir distinguir quais serviços recorrentes ou avulsos devem incidir no cálculo da comissão de 4%.
- Por padrão, serviços recorrentes não geram comissão, a menos que configurado manualmente no cadastro da recorrência.

**Conexões:**
- Herdado do campo `hasCommission` da tabela `RecurringService` durante o lançamento automático.
- Utilizado na rota `/api/analytics/financial-summary` para o cálculo de `commission`.
