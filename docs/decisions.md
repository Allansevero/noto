# Registro de Decisões de Arquitetura (ADR) - NotoMed

## ADR 001: Regras Fiscais de Anti-Duplicação e Compliance em Produção

### Contexto
Na automação de conciliação bancária via Open Finance (Pluggy) e emissão de NFS-e Nacional (Focus NFe), existia o risco de:
1. Emissão indevida de notas fiscais para pagamentos bancários retroativos que ocorreram antes de o paciente existir no sistema.
2. Emissão de múltiplas notas fiscais para o mesmo pagamento bancário (duplicação fiscal por conciliações repetidas da mesma transação bancária).

### Decisão
Implementamos regras de integridade e compliance em camadas (Banco de Dados + API Routes + Serviços):

1. **Rastreamento de Transação Bancária (`pluggy_transacao_id`)**:
   - Adicionada a coluna `pluggy_transacao_id text` e `data_pagamento timestamptz` na tabela `public.notas_fiscais`.
   - Criado um índice único condicional:
     ```sql
     CREATE UNIQUE INDEX idx_notas_fiscais_medico_transacao 
     ON public.notas_fiscais (medico_id, pluggy_transacao_id) 
     WHERE pluggy_transacao_id IS NOT NULL;
     ```
   - Isso garante, ao nível mais baixo do PostgreSQL, que nenhuma nota fiscal pode ser emitida duas vezes para a mesma transação bancária do mesmo médico.

2. **Detecção e Filtro de Transações Novas**:
   - O endpoint `/api/pluggy/check-payment` consulta as transações já faturadas do médico (`notas_fiscais.pluggy_transacao_id`).
   - Se o crédito bancário encontrado já tiver nota emitida no sistema, ele é automaticamente desconsiderado, e o sistema continua aguardando uma nova transferência bancária do paciente que ainda não tenha sido faturada.

3. **Bloqueio de Pagamentos Anteriores ao Paciente (Compliance em Produção)**:
   - Em ambiente de produção (`FOCUS_NFE_ENVIRONMENT=producao` / `ambiente='producao'`), o sistema compara a data do pagamento bancário (`data_pagamento`) com a data de cadastro do paciente (`pacientes.criado_em`).
   - Se `data_pagamento < paciente.criado_em`, a emissão é **bloqueada** com erro 422:
     *"Pagamento recebido em X é anterior ao registro do paciente no sistema em Y. Emissão bloqueada em produção por compliance fiscal."*

### Consequências
- Zero risco de duplicidade de notas para o mesmo crédito bancário.
- Total conformidade fiscal evitando que o médico emita notas retroativas acidentais de pagamentos anteriores ao cadastro do paciente.
- Idempotência ponta-a-ponta garantida tanto na aplicação quanto no banco.
