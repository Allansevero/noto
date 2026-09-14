# NotoMed • Arquitetura, Experiência, Fluxos e Segurança de Dados

Este documento descreve de ponta a ponta a arquitetura técnica, a experiência do usuário (UX/UI), os fluxos operacionais de bastidores e as camadas de segurança e inteligência fiscal que compõem o **NotoMed**.

---

## 1. Visão Geral e a Jornada do Médico no NotoMed

### 1.1. O Problema que o NotoMed Resolve
Médicos e profissionais de saúde com pessoas jurídicas (PJ) perdem horas semanais conciliando extratos bancários com notas fiscais de serviço (NFS-e), calculando alíquotas de ISS por município e emitindo notas manualmente para cada consulta ou procedimento. Esse processo manual acarreta:
1. Bitributação ou recolhimento incorreto de impostos por falta de parametrização exata (Simples Nacional vs. Lucro Presumido, códigos de tributação nacional SPED vs. municipais).
2. Atraso na entrega da documentação fiscal aos pacientes para declaração de IRPF.
3. Risco de perda de dados ou exposição indevida do Certificado Digital A1.

### 1.2. O Propósito do NotoMed
O NotoMed transforma esse cenário em um fluxo autônomo e transparente:
- Conecta a conta bancária do médico via **Open Finance** regulamentado pelo Banco Central.
- Monitora créditos recebidos (PIX e transferências bancárias).
- Identifica e concilia automaticamente o remetente com o cadastro do paciente.
- Dispara a emissão da **NFS-e Nacional padrão SPED v1.00** via **Focus NFe** imediatamente após a confirmação do pagamento, disponibilizando o DANFSE (PDF) e o XML oficial.

---

## 2. A Experiência do Onboarding Passo a Passo

O onboarding do NotoMed foi concebido com uma estética visual minimalista (*dark/light*, fundo branco com malha discreta de micro-pontos e destaque na cor da marca `#B7F20B`). O progresso é salvo atomicamente a cada ação do médico, permitindo retomar de onde parou a qualquer momento.

```
[Etapa 1: Dados Fiscais] ──► [Etapa 2: Certificado A1] ──► [Etapa 3: Open Finance] ──► [Etapa 4: Emissão Real]
   (Upload XML NFS-e)          (Arquivo .pfx / .p12)         (Pluggy Bancos)             (Detecção PIX + NFS-e)
```

---

### Etapa 1: Configuração Fiscal Automática via XML
- **Visão do Usuário:** O médico simplesmente arrasta uma NFS-e emitida anteriormente no formato `.xml` para dentro da área interativa. A animação vetorial do documento confirma a recepção e o sistema realiza a leitura automática.
- **O que o sistema faz por trás dos panos:**
  1. O leitor decodifica o XML SPED e busca as tags fiscais essenciais: CNPJ do prestador (`<emit><CNPJ>`), Razão Social, Inscrição Municipal, Código do Município IBGE, CNAE, Código de Tributação Nacional (`04.01.01` ou variante médica), Alíquota de ISS e regime de tributação (Simples Nacional ou Geral).
  2. Salva e atualiza o registro na tabela `medico_dados_fiscais` do Supabase vinculado ao `medico_id`.
  3. Preenche a prévia dos parâmetros fiscais mapeados em tela para conferência instantânea.
- **O que o sistema NÃO faz:** Não envia nenhum dado a órgãos públicos nesta etapa e não altera configurações pré-existentes na prefeitura. Apenas reconhece a parametrização do emissor.

---

### Etapa 2: Instalação e Homologação do Certificado Digital A1
- **Visão do Usuário:** O médico seleciona o arquivo do certificado `.pfx` ou `.p12`, digita a senha da chave privada (com opção de alternar a visibilidade da senha) e clica em validar.
- **O que o sistema faz por trás dos panos:**
  1. Converte o binário do certificado para Base64 de forma protegida na memória.
  2. Comunica-se exclusivamente via backend (`/api/focus/cadastrar-empresa`) com a API da Focus NFe.
  3. Cadastra ou atualiza os dados da empresa do médico na Focus NFe vinculando o certificado A1 fornecido.
  4. Salva o `focus_empresa_id` e confirma o status `"autorizado"` no Supabase, registrando o timestamp da validação.
- **O que o sistema NÃO faz:** A senha do certificado **nunca é armazenada em texto plano no banco de dados** do NotoMed. O certificado é trafegado diretamente para o ambiente seguro e criptografado da emissora fiscal.

---

### Etapa 3: Conexão Bancária via Open Finance (Pluggy)
- **Visão do Usuário:** O médico clica em "Conectar Conta Bancária". Uma janela oficial e segura do Open Finance (Pluggy) se abre para autenticação direta com o banco da clínica ou consultório.
- **O que o sistema faz por trás dos panos:**
  1. Gera um `connectToken` efêmero via API do Pluggy protegida por credenciais de servidor (`PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`).
  2. Ao finalizar a autorização no banco, o webhook/callback retorna o `itemId` da conexão.
  3. A rota `/api/pluggy/sync-accounts` coleta os metadados bancários (Banco, Tipo de Conta, Agência, Número de Conta e `pluggy_account_id`) e salva em `medico_contas_bancarias`.
  4. **Garantia do Paciente de Teste:** O sistema imediatamente verifica e cadastra/atualiza o paciente oficial de homologação:
     - **Nome:** `33 841 732 Allan Miranda Severo Rodrigues`
     - **CNPJ:** `33.841.732/0001-63` (`33841732000163`)
     - **Valor da Consulta:** `R$ 0,01`
     - **E-mail:** `severoallan2019@gmail.com`
- **O que o sistema NÃO faz:** O NotoMed **não possui permissão de movimentação financeira** (não faz transferências, não debita saldos). A autorização é estritamente de **leitura de extrato** homologada pelo Banco Central do Brasil.

---

### Etapa 4: Validação Real de Pagamento e Emissão da Primeira NFS-e
- **Visão do Usuário:** A etapa inicia automaticamente assim que o médico conclui a conexão bancária. O card exibe o ciclo interativo com animação em perspectiva:
  1. *Conta conectada.*
  2. *Enviando R$ 0,01 para sua conta.* (contagem de 8 segundos)
  3. *Identificado pagamento.* (exibe a data e horário reais da transferência PIX)
  4. *Emitindo sua nota.* (emissão autorizada em homologação)
  Ao emitir a nota:
  - O card de status retrai automaticamente.
  - Entre o card e o documento, surge um texto discreto: `"Abriremos o painel em 10 segundos"` (com contagem regressiva ativa até 0s e link rápido de avanço).
  - O **PDF cru da NFS-e (DANFSE)** é renderizado diretamente na tela, perfeitamente alinhado à largura do layout, sem containers adicionais, sem bordas, sem raio de arredondamento, sem botões e sem confetes, proporcionando o instante "aha" ideal para o médico contemplar a nota oficial emitida antes de ser redirecionado ao painel.
- **O que o sistema faz por trás dos panos:**
  1. Durante a janela de 8 segundos, um PIX de teste de **R$ 0,01** enviado pela conta da NotoMed (`Allan Miranda Severo Rodrigues`) cai na conta bancária conectada do médico.
  2. O backend consulta o extrato da conta bancária via Pluggy (`/api/pluggy/check-payment`).
  3. O conciliador identifica a transação de crédito de R$ 0,01 considerando estritamente pagamentos recebidos a partir do início da validação (regra anti-retroativa e anti-duplicação).
  4. Dispara a rota `/api/focus/emitir-primeira-nota`, transmitindo o JSON oficial para a Focus NFe em ambiente de homologação.
  5. A nota é autorizada pela SEFAZ/SPED Nacional, retornando número oficial, código de verificação, URL do DANFSE e XML.
  6. Registra a nota na tabela `notas_fiscais` com vínculo à transação bancária (`pluggy_transacao_id`), e após os 10 segundos encaminha o médico para o `/dashboard`.

---

## 3. A Experiência e UI Completa do Dashboard

Uma vez concluído o onboarding, o médico acessa o ambiente operacional completo do NotoMed:

### 3.1. Visão Geral (Dashboard)
- **Métricas Chave:** Faturamento bruto mensal, total de impostos provisionados (ISS/Simples Nacional), quantidade de notas emitidas no mês e taxa de conciliação automática (normalmente 98%+).
- **Gráfico de Faturamento & Consultas:** Distribuição temporal das entradas financeiras identificadas.
- **Feed de Atividades em Tempo Real:** Alertas visuais indicando:
  - `"PIX de R$ 350,00 recebido de Mariana Costa • NFS-e Nº 104 emitida automaticamente"`
  - `"Sincronização bancária ativa via Itaú Empresas • Última checagem há 2 min"`

### 3.2. Área de Notas Fiscais (`/dashboard/notas`)
- **Tabela Operacional com Busca e Filtros:** Pesquisa por tomador, CPF/CNPJ, número da nota e status (`autorizada`, `processando`, `cancelada`, `erro`).
- **Visualização de Detalhes:** Drawer lateral ou modal com detalhamento completo da prestação:
  - Código de Tributação Nacional e Municipal.
  - Alíquotas e deduções legais.
  - Vínculo com a transação bancária Open Finance que originou a nota.
- **Ações Rápidas:**
  - Download imediato do **DANFSE (PDF)** e **XML SPED**.
  - Cancelamento formal de nota fiscal com justificativa regulamentar.
  - Reenvio de nota por e-mail ou link seguro para o paciente.

### 3.3. Área de Pacientes (`/dashboard/pacientes`)
- **Gestão Cadastral Completa:** Nome completo, CPF, e-mail, telefone e **Valor da Consulta Padrão**.
- **Histórico Fiscal por Paciente:** Lista de todas as notas fiscais emitidas para aquele tomador ao longo do tempo.
- **Conciliação Inteligente:** O sistema permite definir regras específicas por paciente (ex: convênio vs. particular, retenções especiais).
- **Importação e Exportação:** Exportação simplificada de relatórios para contabilidade e DIMOB (Declaração de Serviços Médicos).

---

## 4. Arquitetura de Bastidores: O que o Sistema Faz e o que Não Faz

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────────┐
│   Banco Médico  │ ────► │  Pluggy API      │ ────► │ NotoMed Engine     │
│  (Crédito PIX)  │       │ (Open Finance)   │       │ (Conciliação)      │
└─────────────────┘       └──────────────────┘       └─────────┬──────────┘
                                                               │ Match Seguro
                                                               ▼
┌─────────────────┐       ┌──────────────────┐       ┌────────────────────┐
│ Paciente / SPED │ ◄──── │ Focus NFe Engine │ ◄──── │ Supabase RLS       │
│  (NFS-e & PDF)  │       │ (Homolog./Prod.) │       │ (Auditoria/Notas)  │
└─────────────────┘       └──────────────────┘       └────────────────────┘
```

| Etapa / Funcionalidade | O que o sistema FAZ | O que o sistema NÃO FAZ |
|---|---|---|
| **Leitura de XML (Etapa 1)** | Extrai automaticamente 15+ parâmetros fiscais SPED para preencher os dados de emissão. | Não substitui o contador do médico; apenas automatiza os parâmetros que o médico já utiliza. |
| **Certificado A1 (Etapa 2)** | Envia o certificado de forma segura e cifrada para a Focus NFe gerenciar as assinaturas fiscais. | Não armazena a senha do certificado em texto plano nem permite download posterior do arquivo .pfx. |
| **Open Finance (Etapa 3)** | Lê extratos de contas PJ/PF autorizadas e monitora novos créditos PIX recebidos. | Não executa transferências, pagamentos, saques nem qualquer alteração na conta do médico. |
| **Conciliação (Etapa 4 / Prod)** | Cruza valor, data, nome do remetente e documento bancário contra a base de pacientes cadastrados. | Não emite nota fiscal para transferências não identificadas ou que não batam com as regras configuradas. |
| **Emissão de NFS-e** | Emite a nota fiscal oficial no padrão da prefeitura ou SPED Nacional e arquiva o XML assinado. | Não emite notas duplicadas para a mesma transação bancária (idempotência garantida). |

---

## 5. Segurança, Cruzamento de Dados e Prevenção Ativa de Erros

A segurança de dados e a integridade fiscal são os pilares fundamentais do NotoMed. O sistema possui guardrails automáticos para impedir qualquer erro operacional:

### 5.1. Regra de Anti-Duplicação (Idempotência Estrita)
- **O Problema:** Em sistemas automatizados, um webhook de banco ou múltiplas consultas de extrato podem identificar o mesmo PIX várias vezes, gerando o risco de emissão duplicada de nota fiscal para uma única consulta.
- **A Solução do NotoMed:**
  1. Cada transação bancária lida via Open Finance possui um identificador único global (`pluggy_transacao_id`).
  2. Antes de iniciar qualquer emissão, o NotoMed consulta o banco de dados (`notas_fiscais`) verificando se aquele `pluggy_transacao_id` já foi faturado para aquele médico.
  3. Caso a transação já tenha sido faturada, o conciliador ignora o evento com registro em log de auditoria, impossibilitando a duplicação.

### 5.2. Regra de Compliance Fiscal em Produção
- **O Problema:** Quando um médico conecta sua conta bancária pela primeira vez, o extrato histórico traz transações dos últimos 30 a 90 dias. Sem proteção, o sistema poderia tentar emitir notas retroativas indevidas para consultas antigas já declaradas.
- **A Solução do NotoMed:**
  1. Em ambiente de produção (`FOCUS_NFE_ENVIRONMENT === "producao"`), o sistema analisa a data de cadastro do paciente no NotoMed (`pacientes.criado_em`).
  2. Transações com data anterior ao registro do paciente são **automaticamente desconsideradas para emissão**, garantindo que apenas pagamentos contemporâneos ou futuros gerem documentos fiscais.

### 5.3. Isolamento Multi-Tenant e Row Level Security (RLS)
- Toda e qualquer tabela do Supabase (`medicos`, `pacientes`, `notas_fiscais`, `medico_dados_fiscais`, `medico_contas_bancarias`) possui **Row Level Security ativado**.
- As políticas de banco garantem que uma requisição autenticada de um médico só consiga ler ou gravar dados com `medico_id` estritamente pertencente ao usuário logado (`auth.uid()`).
- Mesmo em caso de falha de rota no cliente, a política de banco no PostgreSQL impede acessos cruzados entre clínicas.

### 5.4. Separação Estrita de Segredos (Server-Side Only)
- A **`anon key`** pública do Supabase no frontend possui permissões estritamente restritas pelo RLS.
- A chave mestra **`service_role key`**, as credenciais da **Focus NFe** (`FOCUS_NFE_TOKEN`) e os segredos do **Pluggy** (`PLUGGY_CLIENT_SECRET`) nunca são expostos no código React nem trafegam para o navegador do cliente. Todas as chamadas que envolvem essas credenciais ocorrem em rotas protegidas em ambiente server-side (`src/app/api/*`).

---

## 6. Resumo Executivo da Operação

Com esta arquitetura:
1. O onboarding ensina e comprova o valor do sistema em menos de 2 minutos.
2. O envio de **R$ 0,01** da conta `33 841 732 Allan Miranda Severo Rodrigues` comprova que a conciliação funciona com precisão matemática.
3. A nota fiscal surge instantaneamente autorizada, entregando ao médico a segurança e a confiança de que seu faturamento está totalmente automatizado, seguro e em conformidade com a legislação tributária brasileira.
