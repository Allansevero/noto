import { PluggyClient } from 'pluggy-sdk';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const clientId = process.env.CLIENT_ID || process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET || process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'Missing Pluggy credentials. Set CLIENT_ID and CLIENT_SECRET in your environment variables.',
      });
    }

    const pluggy = new PluggyClient({
      clientId,
      clientSecret,
    });

    let clientUserId = req.query?.clientUserId;
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (body?.clientUserId) clientUserId = body.clientUserId;
    }

    const connectToken = await pluggy.createConnectToken({
      clientUserId: clientUserId || undefined,
    });

    return res.status(200).json({ accessToken: connectToken.accessToken });
  } catch (error) {
    console.error('[Pluggy Connect Token Error]', error);
    return res.status(500).json({
      error: error?.message || 'Failed to create Pluggy connect token',
    });
  }
}
