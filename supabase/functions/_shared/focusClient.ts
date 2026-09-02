// Supabase Edge Function Shared: Focus NFe Client Helper

export interface FocusConfig {
  apiUrl?: string;
  token: string;
}

export class FocusNfeClient {
  private apiUrl: string;
  private token: string;

  constructor(config?: Partial<FocusConfig>) {
    const envUrl = typeof Deno !== "undefined" ? Deno.env.get("FOCUS_API_URL") : undefined;
    const defaultUrl = "https://homologacao.focusnfe.com.br";
    this.apiUrl = config?.apiUrl || envUrl || defaultUrl;

    const envToken = typeof Deno !== "undefined" ? Deno.env.get("FOCUS_MASTER_TOKEN") : undefined;
    this.token = config?.token || envToken || "MOCK_FOCUS_TOKEN";
  }

  private getAuthHeader(tokenOverride?: string): string {
    const tokenToUse = tokenOverride || this.token;
    // Focus NFe uses HTTP Basic Auth: username is token, password is empty
    const encoded = btoa(`${tokenToUse}:`);
    return `Basic ${encoded}`;
  }

  async post<T = any>(endpoint: string, body: any, tokenOverride?: string): Promise<{ ok: boolean; status: number; data: T }> {
    const url = `${this.apiUrl}${endpoint}`;
    
    // If no real token is configured, return a simulated successful response in homologation
    if (!this.token || this.token === "MOCK_FOCUS_TOKEN") {
      console.log(`[FocusNFe Mock] POST ${url}`, JSON.stringify(body, null, 2));
      return {
        ok: true,
        status: 201,
        data: {
          status: "processando_autorizacao",
          mensagem: "Requisição aceita e aguardando processamento na prefeitura (Simulação)",
          ref: body.ref || "mock_ref",
        } as any,
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.getAuthHeader(tokenOverride),
      },
      body: JSON.stringify(body),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = { raw: await response.text() };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  async get<T = any>(endpoint: string, tokenOverride?: string): Promise<{ ok: boolean; status: number; data: T }> {
    const url = `${this.apiUrl}${endpoint}`;

    if (!this.token || this.token === "MOCK_FOCUS_TOKEN") {
      console.log(`[FocusNFe Mock] GET ${url}`);
      return {
        ok: true,
        status: 200,
        data: {
          status: "autorizado",
          numero: "2026001",
          caminho_danfe: "https://homologacao.focusnfe.com.br/danfe/mock.pdf",
          caminho_xml_nota_fiscal: "https://homologacao.focusnfe.com.br/xml/mock.xml",
        } as any,
      };
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.getAuthHeader(tokenOverride),
      },
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = { raw: await response.text() };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }
}
