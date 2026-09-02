export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { path: rawPath = "", ref = "", ambiente = "producao" } = req.query;
  // URLSearchParams codifica os '/' do path — precisamos decodificar
  const path = decodeURIComponent(rawPath);
  const masterToken =
    process.env.VITE_FOCUS_MASTER_TOKEN ||
    process.env.VITE_FOCUS_NFE_TOKEN ||
    "vNy8VtxPYbfJB0krBmuQ0ONFeaE0jw7h";
  const homologToken =
    process.env.VITE_FOCUS_HOMOLOGACAO_TOKEN ||
    "H9gjY2Y7Sxo98RuN2e7G1mald2E5FozQ";

  const token = ambiente === "homologacao" ? homologToken : masterToken;
  const host =
    ambiente === "homologacao"
      ? "https://homologacao.focusnfe.com.br"
      : "https://api.focusnfe.com.br";

  const queryRef = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const targetUrl = `${host}${path}${queryRef}`;
  console.log(`[Focus Proxy] ${req.method} → ${targetUrl}`);

  const authHeader =
    req.headers["authorization"] ||
    `Basic ${Buffer.from(`${token}:`).toString("base64")}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    };

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body) {
      fetchOptions.body =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, fetchOptions);
    const contentType = apiRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await apiRes.json();
      return res.status(apiRes.status).json(data);
    } else {
      const text = await apiRes.text();
      return res.status(apiRes.status).send(text);
    }
  } catch (err) {
    console.error("[Focus Proxy Error]", err);
    return res.status(500).json({ error: err.message || "Erro no proxy da Focus NF-e" });
  }
}
