/**
 * Webhook Handler da Pluggy API
 * Endpoint: /api/webhooks/pluggy
 *
 * Importante: Responde com 2XX em menos de 5 segundos conforme exigência da documentação da Pluggy.
 * Tarefas pesadas (sincronização de extratos/transações) são executadas de forma assíncrona.
 * Doc: https://docs.pluggy.ai/docs/webhooks
 */

/**
 * Trata o evento de novo Item (conexão bancária) criado com sucesso
 */
async function handleItemCreated(itemId) {
  console.log('[Pluggy Webhook] Item Criado com sucesso. Item ID:', itemId);
  // TODO: Salvar o itemId vinculado ao médico/usuário no banco de dados
}

/**
 * Trata o evento de Item atualizado (novas transações ou sincronização periódica)
 */
async function handleItemUpdated(itemId) {
  console.log('[Pluggy Webhook] Item Atualizado. Item ID:', itemId);
  // TODO: Sincronizar transações/contas mais recentes usando o PluggyClient
}

/**
 * Trata erro de conexão ou autenticação do Item (ex: senha do banco mudou)
 */
async function handleItemError(itemId, error) {
  console.error('[Pluggy Webhook] Erro no Item ID:', itemId, error);
  // TODO: Notificar o usuário ou marcar status da conexão como 'Ação necessária'
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-pluggy-signature, X-CSRF-Token, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    console.log('[Pluggy Webhook] Evento recebido:', event.event);
    console.log('[Pluggy Webhook] Event ID:', event.eventId);

    // Processamento das tarefas de forma desacoplada
    // Responde com 200 imediatamente para garantir o timeout de 5 segundos da Pluggy
    if (event.event && event.itemId) {
      (async () => {
        try {
          switch (event.event) {
            case 'item/created':
              await handleItemCreated(event.itemId);
              break;
            case 'item/updated':
              await handleItemUpdated(event.itemId);
              break;
            case 'item/error':
              await handleItemError(event.itemId, event.error);
              break;
            default:
              console.log('[Pluggy Webhook] Outro evento recebido:', event.event);
          }
        } catch (procErr) {
          console.error('[Pluggy Webhook Processing Error]', procErr);
        }
      })();
    }

    // Retorna HTTP 200 OK imediatamente dentro do limite de 5s
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Pluggy Webhook Error]', error);
    return res.status(400).json({ error: 'Payload inválido' });
  }
}
