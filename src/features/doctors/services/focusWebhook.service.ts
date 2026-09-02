import { DEFAULT_FOCUS_TOKEN } from "./focusNfe.service";

export type FocusEventType =
  | "nfse"
  | "nfsen"
  | "nfe"
  | "nfce_contingencia"
  | "nfe_recebida"
  | "nfe_recebida_falha_consulta"
  | "nfsen_recebida"
  | "cte_recebida"
  | "inutilizacao"
  | "cte"
  | "mdfe"
  | "nfcom"
  | "nfce_consulta_automatica";

export interface FocusHook {
  id: string;
  url: string;
  authorization?: string | null;
  authorization_header?: string | null;
  event: FocusEventType;
  cnpj?: string | null;
  cpf?: string | null;
}

export interface CreateHookInput {
  event: FocusEventType;
  url: string;
  cnpj?: string;
  cpf?: string;
  authorization?: string;
  authorization_header?: string;
  token?: string;
}

export interface HookResponse {
  success: boolean;
  hook?: FocusHook;
  message?: string;
  error?: string;
}

/**
 * Cria um novo gatilho (Webhook) na Focus NF-e
 * POST /v2/hooks
 */
export async function createFocusHook(input: CreateHookInput): Promise<HookResponse> {
  const token = input.token || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN;
  const isBrowser = typeof window !== "undefined";
  const endpoint = isBrowser ? "/focus-api/v2/hooks" : "https://api.focusnfe.com.br/v2/hooks";

  const cleanDigits = (v?: string) => (v ? v.replace(/\D/g, "") : undefined);

  const payload: Record<string, unknown> = {
    event: input.event,
    url: input.url,
  };

  const cleanCnpj = cleanDigits(input.cnpj);
  const cleanCpf = cleanDigits(input.cpf);

  if (cleanCnpj && cleanCnpj.length === 14) {
    payload.cnpj = cleanCnpj;
  } else if (cleanCpf && cleanCpf.length === 11) {
    payload.cpf = cleanCpf;
  }

  if (input.authorization) {
    payload.authorization = input.authorization;
    if (input.authorization_header) {
      payload.authorization_header = input.authorization_header;
    }
  }

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (response.ok || response.status === 200 || response.status === 201) {
      return {
        success: true,
        hook: data as FocusHook,
        message: `Gatilho '${input.event}' criado com sucesso para ${input.url}!`,
      };
    } else {
      const errorMsg = data?.mensagem || data?.erros?.[0]?.mensagem || `Erro HTTP ${response.status} ao criar gatilho`;
      return {
        success: false,
        error: errorMsg,
        message: errorMsg,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Falha de conexão com a Focus NF-e ao criar gatilho.",
      message: err.message,
    };
  }
}

/**
 * Lista todos os gatilhos (Webhooks) cadastrados para o token na Focus NF-e
 * GET /v2/hooks
 */
export async function listFocusHooks(tokenOverride?: string): Promise<FocusHook[]> {
  const token = tokenOverride || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN;
  const isBrowser = typeof window !== "undefined";
  const endpoint = isBrowser ? "/focus-api/v2/hooks" : "https://api.focusnfe.com.br/v2/hooks";

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      console.warn("Erro ao listar gatilhos Focus NF-e:", response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Erro ao listar gatilhos Focus NF-e:", err);
    return [];
  }
}

/**
 * Consulta um gatilho por ID na Focus NF-e
 * GET /v2/hooks/{id}
 */
export async function getFocusHook(hookId: string, tokenOverride?: string): Promise<FocusHook | null> {
  const token = tokenOverride || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN;
  const isBrowser = typeof window !== "undefined";
  const endpoint = isBrowser ? `/focus-api/v2/hooks/${hookId}` : `https://api.focusnfe.com.br/v2/hooks/${hookId}`;

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as FocusHook;
  } catch (err) {
    console.error(`Erro ao consultar gatilho #${hookId}:`, err);
    return null;
  }
}

/**
 * Exclui um gatilho na Focus NF-e
 * DELETE /v2/hooks/{id}
 */
export async function deleteFocusHook(hookId: string, tokenOverride?: string): Promise<boolean> {
  const token = tokenOverride || import.meta.env.VITE_FOCUS_NFE_TOKEN || DEFAULT_FOCUS_TOKEN;
  const isBrowser = typeof window !== "undefined";
  const endpoint = isBrowser ? `/focus-api/v2/hooks/${hookId}` : `https://api.focusnfe.com.br/v2/hooks/${hookId}`;

  try {
    const authHeader = `Basic ${btoa(`${token}:`)}`;
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    return response.ok || response.status === 200 || response.status === 204;
  } catch (err) {
    console.error(`Erro ao excluir gatilho #${hookId}:`, err);
    return false;
  }
}
