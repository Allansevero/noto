export interface PluggyWebhookPayload {
  event: 'item/created' | 'item/updated' | 'item/error' | 'item/deleted' | 'item/waiting_user_input' | string;
  eventId: string;
  itemId: string;
  error?: {
    code: string;
    message: string;
  };
  triggeredAt?: string;
}

/**
 * Funções utilitárias para lidar com eventos do Webhook da Pluggy
 */
export async function processPluggyWebhookEvent(payload: PluggyWebhookPayload) {
  console.log(`[Pluggy Webhook Service] Processando evento: ${payload.event} para itemId: ${payload.itemId}`);
  
  switch (payload.event) {
    case 'item/created':
      // Item recém conectado
      break;
    case 'item/updated':
      // Item atualizado com novos dados
      break;
    case 'item/error':
      // Erro reportado pelo conector
      break;
  }
}
