import { PluggyConnect } from 'react-pluggy-connect';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface OpenFinanceConnectProps {
  onSuccess?: (itemData: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  clientUserId?: string;
  includeSandbox?: boolean;
}

export function OpenFinanceConnect({
  onSuccess,
  onError,
  onClose,
  clientUserId,
  includeSandbox = true,
}: OpenFinanceConnectProps) {
  const [connectToken, setConnectToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const url = clientUserId 
      ? `/api/connect-token?clientUserId=${encodeURIComponent(clientUserId)}`
      : '/api/connect-token';

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erro ao obter connect token (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.accessToken) {
            setConnectToken(data.accessToken);
          } else {
            throw new Error('Token de acesso não retornado pelo servidor.');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[OpenFinanceConnect Error]', err);
          setErrorMessage(err.message || 'Falha ao conectar ao serviço Open Finance.');
          onError?.(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientUserId, onError]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 text-muted-foreground min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Iniciando conexão segura Open Finance...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center border border-destructive/20 bg-destructive/5 rounded-md min-h-[200px]">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        <p className="text-xs text-muted-foreground">
          Certifique-se de que CLIENT_ID e CLIENT_SECRET foram configurados nas variáveis de ambiente.
        </p>
      </div>
    );
  }

  if (!connectToken) {
    return null;
  }

  return (
    <PluggyConnect
      connectToken={connectToken}
      includeSandbox={includeSandbox}
      onSuccess={(itemData) => {
        console.log('Connected!', itemData);
        onSuccess?.(itemData);
      }}
      onError={(error) => {
        console.error('Connection failed', error);
        onError?.(error);
      }}
      onClose={() => {
        onClose?.();
      }}
    />
  );
}

export default OpenFinanceConnect;
