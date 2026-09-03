/**
 * Serviço client-side para integração segura com a Pluggy.
 * Todas as credenciais sensíveis (CLIENT_ID / CLIENT_SECRET) residem exclusivamente no servidor.
 */

export interface ConnectTokenResponse {
  accessToken: string;
}

/**
 * Solicita ao backend (/api/connect-token) um Connect Token temporário
 * para abrir o widget do Pluggy Connect no frontend.
 * 
 * @param clientUserId Opcional: ID do usuário no seu sistema para rastreamento no Pluggy
 */
export async function fetchPluggyConnectToken(clientUserId?: string): Promise<string> {
  const response = await fetch('/api/connect-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientUserId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ao gerar connect token da Pluggy (${response.status})`);
  }

  const data: ConnectTokenResponse = await response.json();
  return data.accessToken;
}
