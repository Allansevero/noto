import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Carrega .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v) env[k.trim()] = v.join("=").trim();
  });
}

const masterToken = env.VITE_FOCUS_NFE_TOKEN || "vNy8VtxPYbfJB0krBmuQ0ONFeaE0jw7h";

async function updateAndTestNfsen() {
  console.log("== 1. Habilitando NFS-e Nacional na Empresa 251778 via PUT (habilita_nfse: false, habilita_nfsen_producao: true) ==");
  const authHeader = `Basic ${Buffer.from(`${masterToken}:`).toString("base64")}`;

  const updateEmpresaRes = await fetch("https://api.focusnfe.com.br/v2/empresas/251778", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      nome: "ACM XAVIER SERVICOS MEDICOS LTDA",
      nome_fantasia: "ACM XAVIER SERVICOS MEDICOS LTDA",
      bairro: "JARDIM EUROPA",
      cep: 91340020,
      cnpj: "55067216000166",
      discrimina_impostos: true,
      email: "draa@gmail.com",
      enviar_email_destinatario: true,
      habilita_nfse: false,
      habilita_nfsen_producao: true,
      habilita_nfsen_homologacao: true,
      logradouro: "RUA ANTONIO CARLOS BERTA",
      numero: 475,
      municipio: "PORTO ALEGRE",
      uf: "RS",
      regime_tributario: 1,
      telefone: "51981936133",
    }),
  });

  console.log(`Status atualização empresa: HTTP ${updateEmpresaRes.status}`);
  const empData = await updateEmpresaRes.json();
  console.log("Empresa atualizada na Focus:", empData?.id ? `ID #${empData.id} atualizado com SUCESSO!` : empData);

  console.log("\n== 2. Testando Emissão via /v2/nfsen (NFS-e Nacional) ==");
  const ref = `teste_nfsen_${Date.now()}`;
  const token = empData?.token_producao || empData?.token_homologacao || masterToken;
  const tokenAuthHeader = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;

  const payload = {
    data_emissao: new Date().toISOString(),
    natureza_operacao: "1",
    optante_simples_nacional: true,
    prestador: {
      cnpj: "55067216000166",
      codigo_municipio: "4314902",
    },
    tomador: {
      cpf: "12345678900",
      razao_social: "Carlos Eduardo da Silva",
      email: "carlos.silva@exemplo.com",
      telefone: "51999998888",
    },
    servico: {
      discriminacao: "Consulta Medica Ambulatorial - Dr(a). Alice Xavier",
      valor_servicos: 250.0,
      aliquota: 3.0,
      item_lista_servico: "0401",
    },
  };

  const emitRes = await fetch(`https://api.focusnfe.com.br/v2/nfsen?ref=${ref}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: tokenAuthHeader,
    },
    body: JSON.stringify(payload),
  });

  console.log(`Status de Emissão /v2/nfsen: HTTP ${emitRes.status}`);
  const emitData = await emitRes.json();
  console.log("Resposta da Focus NF-e:", emitData);
}

updateAndTestNfsen();
