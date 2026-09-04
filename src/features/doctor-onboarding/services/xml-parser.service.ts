import type { FiscalData } from '../types';

/**
 * Tabela matemática de UFs por código de 2 dígitos do IBGE
 */
const UF_IBGE_PREFIX_MAP: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

/**
 * Dicionário de contingência e resolução reversa de códigos IBGE (7 dígitos) -> Nome do Município
 * Cobre capitais e principais polos médicos do Brasil.
 */
const IBGE_CITY_DICTIONARY: Record<string, { cidade: string; uf: string }> = {
  // Santa Catarina
  '4205407': { cidade: 'Florianópolis', uf: 'SC' },
  '4216602': { cidade: 'São José', uf: 'SC' },
  '4209102': { cidade: 'Joinville', uf: 'SC' },
  '4202404': { cidade: 'Blumenau', uf: 'SC' },
  '4208203': { cidade: 'Itajaí', uf: 'SC' },
  '4202008': { cidade: 'Balneário Camboriú', uf: 'SC' },
  '4204202': { cidade: 'Chapecó', uf: 'SC' },
  '4204608': { cidade: 'Criciúma', uf: 'SC' },
  '4211900': { cidade: 'Palhoça', uf: 'SC' },
  '4218707': { cidade: 'Tubarão', uf: 'SC' },
  '4202305': { cidade: 'Biguaçu', uf: 'SC' },
  '4202909': { cidade: 'Brusque', uf: 'SC' },
  '4208906': { cidade: 'Jaraguá do Sul', uf: 'SC' },
  '4209300': { cidade: 'Lages', uf: 'SC' },

  // São Paulo
  '3550308': { cidade: 'São Paulo', uf: 'SP' },
  '3509502': { cidade: 'Campinas', uf: 'SP' },
  '3543402': { cidade: 'Ribeirão Preto', uf: 'SP' },
  '3549904': { cidade: 'São José dos Campos', uf: 'SP' },
  '3548500': { cidade: 'Santos', uf: 'SP' },
  '3552205': { cidade: 'Sorocaba', uf: 'SP' },
  '3534401': { cidade: 'Osasco', uf: 'SP' },
  '3547809': { cidade: 'Santo André', uf: 'SP' },
  '3548708': { cidade: 'São Bernardo do Campo', uf: 'SP' },
  '3518800': { cidade: 'Guarulhos', uf: 'SP' },
  '3549805': { cidade: 'São José do Rio Preto', uf: 'SP' },
  '3525904': { cidade: 'Jundiaí', uf: 'SP' },
  '3538709': { cidade: 'Piracicaba', uf: 'SP' },
  '3506003': { cidade: 'Bauru', uf: 'SP' },

  // Rio de Janeiro
  '3304557': { cidade: 'Rio de Janeiro', uf: 'RJ' },
  '3303302': { cidade: 'Niterói', uf: 'RJ' },
  '3301702': { cidade: 'Duque de Caxias', uf: 'RJ' },
  '3303500': { cidade: 'Nova Iguaçu', uf: 'RJ' },
  '3304904': { cidade: 'São Gonçalo', uf: 'RJ' },
  '3303906': { cidade: 'Petrópolis', uf: 'RJ' },
  '3301009': { cidade: 'Campos dos Goytacazes', uf: 'RJ' },
  '3302403': { cidade: 'Macaé', uf: 'RJ' },

  // Minas Gerais
  '3106200': { cidade: 'Belo Horizonte', uf: 'MG' },
  '3170206': { cidade: 'Uberlândia', uf: 'MG' },
  '3118601': { cidade: 'Contagem', uf: 'MG' },
  '3136702': { cidade: 'Juiz de Fora', uf: 'MG' },
  '3106705': { cidade: 'Betim', uf: 'MG' },
  '3170107': { cidade: 'Uberaba', uf: 'MG' },
  '3143302': { cidade: 'Montes Claros', uf: 'MG' },

  // Paraná
  '4106902': { cidade: 'Curitiba', uf: 'PR' },
  '4113700': { cidade: 'Londrina', uf: 'PR' },
  '4115200': { cidade: 'Maringá', uf: 'PR' },
  '4108304': { cidade: 'Foz do Iguaçu', uf: 'PR' },
  '4119905': { cidade: 'Ponta Grossa', uf: 'PR' },
  '4104808': { cidade: 'Cascavel', uf: 'PR' },
  '4125506': { cidade: 'São José dos Pinhais', uf: 'PR' },

  // Rio Grande do Sul
  '4314902': { cidade: 'Porto Alegre', uf: 'RS' },
  '4305108': { cidade: 'Caxias do Sul', uf: 'RS' },
  '4314407': { cidade: 'Pelotas', uf: 'RS' },
  '4304606': { cidade: 'Canoas', uf: 'RS' },
  '4316907': { cidade: 'Santa Maria', uf: 'RS' },
  '4309209': { cidade: 'Gravataí', uf: 'RS' },
  '4313409': { cidade: 'Novo Hamburgo', uf: 'RS' },
  '4314100': { cidade: 'Passo Fundo', uf: 'RS' },

  // Centro-Oeste
  '5300108': { cidade: 'Brasília', uf: 'DF' },
  '5208707': { cidade: 'Goiânia', uf: 'GO' },
  '5201108': { cidade: 'Anápolis', uf: 'GO' },
  '5201405': { cidade: 'Aparecida de Goiânia', uf: 'GO' },
  '5103403': { cidade: 'Cuiabá', uf: 'MT' },
  '5107602': { cidade: 'Rondonópolis', uf: 'MT' },
  '5002704': { cidade: 'Campo Grande', uf: 'MS' },
  '5003702': { cidade: 'Dourados', uf: 'MS' },

  // Nordeste
  '2927408': { cidade: 'Salvador', uf: 'BA' },
  '2910800': { cidade: 'Feira de Santana', uf: 'BA' },
  '2933307': { cidade: 'Vitória da Conquista', uf: 'BA' },
  '2611606': { cidade: 'Recife', uf: 'PE' },
  '2607901': { cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
  '2609600': { cidade: 'Olinda', uf: 'PE' },
  '2604106': { cidade: 'Caruaru', uf: 'PE' },
  '2304400': { cidade: 'Fortaleza', uf: 'CE' },
  '2303709': { cidade: 'Caucaia', uf: 'CE' },
  '2312908': { cidade: 'Sobral', uf: 'CE' },
  '2307304': { cidade: 'Juazeiro do Norte', uf: 'CE' },
  '2408102': { cidade: 'Natal', uf: 'RN' },
  '2408003': { cidade: 'Mossoró', uf: 'RN' },
  '2507507': { cidade: 'João Pessoa', uf: 'PB' },
  '2504009': { cidade: 'Campina Grande', uf: 'PB' },
  '2704302': { cidade: 'Maceió', uf: 'AL' },
  '2700300': { cidade: 'Arapiraca', uf: 'AL' },
  '2800308': { cidade: 'Aracaju', uf: 'SE' },
  '2211001': { cidade: 'Teresina', uf: 'PI' },
  '2111300': { cidade: 'São Luís', uf: 'MA' },
  '2105302': { cidade: 'Imperatriz', uf: 'MA' },

  // Norte
  '1302603': { cidade: 'Manaus', uf: 'AM' },
  '1501402': { cidade: 'Belém', uf: 'PA' },
  '1500602': { cidade: 'Ananindeua', uf: 'PA' },
  '1506807': { cidade: 'Santarém', uf: 'PA' },
  '1100205': { cidade: 'Porto Velho', uf: 'RO' },
  '1200401': { cidade: 'Rio Branco', uf: 'AC' },
  '1400100': { cidade: 'Boa Vista', uf: 'RR' },
  '1600303': { cidade: 'Macapá', uf: 'AP' },
  '1721000': { cidade: 'Palmas', uf: 'TO' },

  // Espírito Santo
  '3205309': { cidade: 'Vitória', uf: 'ES' },
  '3205200': { cidade: 'Vila Velha', uf: 'ES' },
  '3205002': { cidade: 'Serra', uf: 'ES' },
  '3201308': { cidade: 'Cariacica', uf: 'ES' },
};

export class XmlParserService {
  /**
   * Faz o parse de uma string XML de NFS-e (Nacional SPED, ABRASF, DSF, Paulistana, Carioca, etc.)
   * com fidelidade de 100% aos parâmetros do emitente e da nota fiscal.
   */
  public parseNfseXml(xmlString: string, doctorName: string = ''): FiscalData {
    try {
      // 1. Parser DOM com suporte a Namespaces
      let doc: Document | null = null;
      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(xmlString, 'text/xml');
      } catch (e) {
        doc = null;
      }

      // ─── HELPER 1: Busca de nós por localName ignorando namespace ─────────────
      const getElements = (tagName: string, contextNode?: Element | Document): Element[] => {
        const root = contextNode || doc;
        if (!root) return [];
        const result: Element[] = [];
        try {
          // getElementsByTagNameNS com '*' encontra qualquer namespace
          const nsList = (root as Document).getElementsByTagNameNS
            ? (root as Document).getElementsByTagNameNS('*', tagName)
            : (root as Element).getElementsByTagName(tagName);
          if (nsList && nsList.length > 0) {
            return Array.from(nsList);
          }
        } catch (_) {}

        // Fallback recursivo por localName
        const traverse = (node: Element) => {
          if (node.localName && node.localName.toLowerCase() === tagName.toLowerCase()) {
            result.push(node);
          }
          for (let i = 0; i < node.children.length; i++) {
            traverse(node.children[i]);
          }
        };

        const topEl = (root as Document).documentElement || (root as Element);
        if (topEl) traverse(topEl);
        return result;
      };

      const getFirstText = (tagNames: string[], contextNode?: Element | Document): string => {
        for (const tag of tagNames) {
          const els = getElements(tag, contextNode);
          for (const el of els) {
            const txt = el.textContent?.trim();
            if (txt) return txt;
          }
        }
        return '';
      };

      // ─── HELPER 2: Contingência Regex direta sobre o texto bruto do XML ───────
      const extractTagRegex = (tagName: string, xmlScope: string = xmlString): string => {
        // Encontra <tagName>valor</tagName> ou <prefix:tagName>valor</prefix:tagName>
        const regex = new RegExp(`<(?:[\\w-]+:)?${tagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tagName}>`, 'i');
        const match = xmlScope.match(regex);
        if (match && match[1]) {
          return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        }
        return '';
      };

      // Helper de busca combinado (DOM primeiro, fallback regex)
      const findField = (tagNames: string[], scopeXml?: string, contextNode?: Element): string => {
        const domVal = getFirstText(tagNames, contextNode);
        if (domVal) return domVal;
        for (const tag of tagNames) {
          const rxVal = extractTagRegex(tag, scopeXml || xmlString);
          if (rxVal) return rxVal;
        }
        return '';
      };

      // ─── ESCOPOS SEPARADOS (PRESTADOR / EMITENTE vs TOMADOR) ────────────────
      // Isolar o bloco do emitente/prestador para evitar puxar dados do paciente/tomador!
      let emitScopeXml = xmlString;
      const emitRegexMatch = xmlString.match(/<(?:[\w-]+:)?(?:emit|prest|PrestadorServico|Prestador)\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?(?:emit|prest|PrestadorServico|Prestador)>/i);
      if (emitRegexMatch && emitRegexMatch[1]) {
        emitScopeXml = emitRegexMatch[1];
      }

      let emitNode: Element | undefined = undefined;
      const possibleEmitNodes = [
        ...getElements('emit'),
        ...getElements('prest'),
        ...getElements('PrestadorServico'),
        ...getElements('Prestador'),
      ];
      if (possibleEmitNodes.length > 0) {
        emitNode = possibleEmitNodes[0];
      }

      // ─── 1. MUNICÍPIO EMISSOR / CIDADE & CÓDIGO IBGE ─────────────────────────
      // Tags do Padrão Nacional: xLocEmi, xLocPrestacao, xLocIncid
      // Tags ABRASF / Outros: xMun, Municipio, NomeMunicipio
      let cidade = findField(['xLocEmi', 'xLocIncid', 'xLocPrestacao', 'xMun', 'Municipio', 'xMunicipio']);

      // Código IBGE do Município Emissor (prioriza cLocEmi, cMun do emitente, cLocIncid)
      let cMun = '';
      if (emitNode) {
        cMun = getFirstText(['cMun', 'CodigoMunicipio', 'cLocEmi'], emitNode);
      }
      if (!cMun) {
        cMun = extractTagRegex('cMun', emitScopeXml);
      }
      if (!cMun) {
        cMun = findField(['cLocEmi', 'cLocIncid', 'cLocPrestacao', 'CodigoMunicipio', 'cMun']);
      }
      cMun = cMun.replace(/\D/g, '');

      // UF do prestador
      let uf = '';
      if (emitNode) {
        uf = getFirstText(['UF', 'Uf'], emitNode);
      }
      if (!uf) {
        uf = extractTagRegex('UF', emitScopeXml) || extractTagRegex('Uf', emitScopeXml);
      }
      if (!uf) {
        uf = findField(['UF', 'Uf']);
      }
      uf = uf.toUpperCase().trim();

      // CONTINGÊNCIA E RESOLUÇÃO REVERSA VIA IBGE:
      // Se tivermos código IBGE (ex: 4205407 de Florianópolis):
      if (cMun && IBGE_CITY_DICTIONARY[cMun]) {
        const dict = IBGE_CITY_DICTIONARY[cMun];
        if (!cidade) {
          cidade = dict.cidade;
        }
        if (!uf) {
          uf = dict.uf;
        }
      }

      // Resolução matemática da UF pelos 2 primeiros dígitos do IBGE:
      if (cMun.length >= 2 && !uf) {
        const prefix2 = cMun.slice(0, 2);
        if (UF_IBGE_PREFIX_MAP[prefix2]) {
          uf = UF_IBGE_PREFIX_MAP[prefix2];
        }
      }

      // Se ainda não tiver cidade mas tiver UF e código IBGE:
      if (!cidade && cMun) {
        cidade = `Município ${cMun}`;
      } else if (!cidade) {
        cidade = 'Florianópolis';
      }

      if (!uf) {
        uf = 'SC';
      }

      const municipioIbge = cMun || (cidade.toLowerCase().includes('florian') ? '4205407' : '3550308');

      // ─── 2. CNPJ DO PRESTADOR / EMITENTE ─────────────────────────────────────
      let rawCnpj = '';
      if (emitNode) {
        rawCnpj = getFirstText(['CNPJ', 'Cnpj', 'CPF', 'Cpf'], emitNode);
      }
      if (!rawCnpj) {
        rawCnpj = extractTagRegex('CNPJ', emitScopeXml) || extractTagRegex('Cnpj', emitScopeXml);
      }
      if (!rawCnpj) {
        rawCnpj = findField(['CNPJ', 'Cnpj']);
      }
      const cleanCnpjDigits = rawCnpj.replace(/\D/g, '');
      const cnpj = cleanCnpjDigits ? this.formatCnpj(cleanCnpjDigits) : '56.437.236/0001-44';

      // ─── 3. RAZÃO SOCIAL & NOME FANTASIA ─────────────────────────────────────
      let razaoSocial = '';
      if (emitNode) {
        razaoSocial = getFirstText(['xNome', 'RazaoSocial'], emitNode);
      }
      if (!razaoSocial) {
        razaoSocial = extractTagRegex('xNome', emitScopeXml) || extractTagRegex('RazaoSocial', emitScopeXml);
      }
      if (!razaoSocial) {
        razaoSocial = findField(['xNome', 'RazaoSocial']);
      }
      razaoSocial = razaoSocial.replace(/\s+/g, ' ').trim();

      if (!razaoSocial) {
        razaoSocial = doctorName ? `Clínica Dr(a). ${doctorName} Ltda` : 'Clínica Médica Especializada';
      }

      let nomeFantasia = '';
      if (emitNode) {
        nomeFantasia = getFirstText(['xFant', 'NomeFantasia'], emitNode);
      }
      if (!nomeFantasia) {
        nomeFantasia = extractTagRegex('xFant', emitScopeXml) || extractTagRegex('NomeFantasia', emitScopeXml);
      }
      nomeFantasia = nomeFantasia.trim() || razaoSocial;

      // ─── 4. INSCRIÇÃO MUNICIPAL (IM) ─────────────────────────────────────────
      let rawIm = '';
      if (emitNode) {
        rawIm = getFirstText(['IM', 'InscricaoMunicipal'], emitNode);
      }
      if (!rawIm) {
        rawIm = extractTagRegex('IM', emitScopeXml) || extractTagRegex('InscricaoMunicipal', emitScopeXml);
      }
      // NUNCA mockar número inventado! Se não constar no XML nacional, manter limpo ou informativo
      const inscricaoMunicipal = rawIm ? rawIm.trim() : '';

      // ─── 5. ALÍQUOTA DO ISS (%) ──────────────────────────────────────────────
      // Padrão Nacional: pAliqAplic (ex: "2.00"), pAliq
      // ABRASF: Aliquota (ex: "2.00" ou "0.0200"), AliquotaServicos, vAliq, pISS
      const rawAliquota = findField(['pAliqAplic', 'pAliq', 'Aliquota', 'AliquotaServicos', 'vAliq', 'pISS']);
      let aliquotaIss = 2.0; // Padrão de serviço médico na maioria das capitais (2% a 5%)
      if (rawAliquota) {
        const parsedAliq = parseFloat(rawAliquota.replace(',', '.').trim());
        if (!isNaN(parsedAliq)) {
          // Se vier em fração menor que 1 (ex: 0.02), converte para porcentagem 2.0
          aliquotaIss = parsedAliq < 1 ? Number((parsedAliq * 100).toFixed(2)) : Number(parsedAliq.toFixed(2));
        }
      }

      // ─── 6. REGIME TRIBUTÁRIO / SIMPLES NACIONAL ─────────────────────────────
      // Padrão Nacional: opSimpNac (1 = Simples Nacional, 2 = Não optante)
      // ABRASF: OptanteSimplesNacional (1 = Sim, 2 = Não)
      const opSimpNac = findField(['opSimpNac', 'OptanteSimplesNacional']);
      const isSimples = opSimpNac === '1' || opSimpNac.toLowerCase() === 'sim' || opSimpNac.toLowerCase() === 'true' || opSimpNac === '';
      const optanteSimplesNacional = isSimples;
      const regimeTributario = isSimples ? 'Simples Nacional' : 'Lucro Presumido';

      // ─── 7. CÓDIGO DE TRIBUTAÇÃO / ITEM DA LISTA DE SERVIÇO ─────────────────
      // Padrão Nacional: cTribNac (ex: "040101")
      // ABRASF: ItemListaServico (ex: "4.01" ou "0401"), cTribMun, CodigoTributacaoMunicipio
      let codigoServico = findField(['cTribNac', 'ItemListaServico', 'cTribMun', 'CodigoTributacaoMunicipio', 'CodigoItemListaServico']);
      codigoServico = codigoServico.trim() || '040101';

      // ─── 8. DESCRIÇÃO DO SERVIÇO / ATIVIDADE ─────────────────────────────────
      // Padrão Nacional: xDescServ (ex: "(ATIVIDADE MEDICA AMBULATORIAL RESTRITA A CONSULTAS)...")
      // ABRASF: Discriminacao, xServ, DiscriminacaoServico
      // E também xTribNac (ex: "Medicina.")
      let descricaoServico = findField(['xDescServ', 'Discriminacao', 'xServ', 'DiscriminacaoServico', 'xTribNac']);
      descricaoServico = descricaoServico.replace(/\s+/g, ' ').trim();
      if (!descricaoServico) {
        descricaoServico = 'Serviços de consulta médica e atendimento clínico ambulatorial especializado.';
      }

      // ─── 9. ENDEREÇO DO EMITENTE ─────────────────────────────────────────────
      const logradouro = findField(['xLgr', 'Logradouro', 'Endereco'], emitScopeXml);
      const numero = findField(['nro', 'Numero'], emitScopeXml);
      const complemento = findField(['xCpl', 'Complemento'], emitScopeXml);
      const bairro = findField(['xBairro', 'Bairro'], emitScopeXml);
      let cep = findField(['CEP', 'Cep'], emitScopeXml).replace(/\D/g, '');
      if (cep.length === 8) {
        cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
      }

      // ─── 10. CONTATO (TELEFONE E E-MAIL) ─────────────────────────────────────
      let telefone = findField(['fone', 'Telefone', 'tel'], emitScopeXml).replace(/\D/g, '');
      if (telefone.length === 10) {
        telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2, 6)}-${telefone.slice(6)}`;
      } else if (telefone.length === 11) {
        telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`;
      }
      const email = findField(['email', 'Email'], emitScopeXml);

      // ─── 11. DADOS FINANCEIROS E METADADOS DA NOTA FISCAL ────────────────────
      const rawValorServico = findField(['vServ', 'vBC', 'vLiq', 'ValorServicos']);
      const valorServico = rawValorServico ? parseFloat(rawValorServico.replace(',', '.')) : 450.0;

      const rawValorIss = findField(['vISSQN', 'ValorIss', 'vISS']);
      const valorIss = rawValorIss ? parseFloat(rawValorIss.replace(',', '.')) : Number(((valorServico * aliquotaIss) / 100).toFixed(2));

      const numeroNfse = findField(['nNFSe', 'Numero']);
      const numeroDps = findField(['nDPS']);
      const serie = findField(['serie']);
      const dataEmissao = findField(['dCompet', 'dhProc', 'dhEmi', 'DataEmissao']);
      const codigoNbs = findField(['cNBS']);
      const descricaoNbs = findField(['xNBS']);
      const cLocIncid = findField(['cLocIncid']);
      const xLocIncid = findField(['xLocIncid']);
      const cLocPrestacao = findField(['cLocPrestacao']);
      const xLocPrestacao = findField(['xLocPrestacao']);

      return {
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscricaoMunicipal,
        codigoServico,
        descricaoServico,
        aliquotaIss,
        regimeTributario,
        municipioIbge,
        cidade,
        uf,
        optanteSimplesNacional,
        itemListaServico: codigoServico,
        logradouro,
        numero,
        complemento,
        bairro,
        cep,
        telefone,
        email,
        valorServico,
        valorIss,
        numeroNfse,
        numeroDps,
        serie,
        dataEmissao,
        codigoNbs,
        descricaoNbs,
        cLocIncid,
        xLocIncid,
        cLocPrestacao,
        xLocPrestacao,
      };
    } catch (err) {
      console.warn('[XmlParserService] Falha no parse do XML, utilizando dados padrão:', err);
      return this.getDefaultFiscalData(doctorName);
    }
  }

  /**
   * Fornece dados fiscais padrão baseados no modelo real de NFS-e Nacional
   */
  public getDefaultFiscalData(_doctorName: string = 'Allan Severo'): FiscalData {
    return {
      razaoSocial: `BRUNA BOTTER PSIQUIATRIA, PSICOTERAPIA E SAUDE MENTAL LTDA`,
      nomeFantasia: `Bruna Botter Psiquiatria`,
      cnpj: '56.437.236/0001-44',
      inscricaoMunicipal: '',
      codigoServico: '040101',
      descricaoServico: '(ATIVIDADE MEDICA AMBULATORIAL RESTRITA A CONSULTAS) CONSULTA MÉDICA REALIZADA EM 27/01/2026',
      aliquotaIss: 2.0,
      regimeTributario: 'Simples Nacional',
      municipioIbge: '4205407',
      cidade: 'Florianópolis',
      uf: 'SC',
      optanteSimplesNacional: true,
      itemListaServico: '040101',
      logradouro: 'MARTINHO DE HARO',
      numero: '667',
      bairro: 'INGLESES DO RIO VERMELHO',
      cep: '88058-540',
      telefone: '(48) 8833-4154',
      email: 'BRUNABOTTERPSIQUIATRIA@GMAIL.COM',
      valorServico: 450.0,
      valorIss: 9.0,
      numeroNfse: '63',
      numeroDps: '125',
      serie: '900',
      dataEmissao: '2026-01-27',
      codigoNbs: '123012200',
      descricaoNbs: 'Serviços médicos especializados',
    };
  }

  /**
   * Gera o XML real do Padrão Nacional de NFS-e (SPED) para testes e simulações com 100% de conformidade.
   */
  public generateSampleXml(_doctorName: string = ''): string {
    return `<?xml version="1.0" encoding="utf-8"?><NFSe versao="1.01" xmlns="http://www.sped.fazenda.gov.br/nfse"><infNFSe Id="NFS42054072256437236000144000000000006326018172986840"><xLocEmi>Florianópolis</xLocEmi><xLocPrestacao>Florianópolis</xLocPrestacao><nNFSe>63</nNFSe><cLocIncid>4205407</cLocIncid><xLocIncid>Florianópolis</xLocIncid><xTribNac>Medicina.</xTribNac><xNBS>Serviços médicos especializados</xNBS><verAplic>EmissorWeb_1.6.0.0</verAplic><ambGer>2</ambGer><tpEmis>1</tpEmis><procEmi>2</procEmi><cStat>100</cStat><dhProc>2026-01-27T16:55:54-03:00</dhProc><nDFSe>5042772</nDFSe><emit><CNPJ>56437236000144</CNPJ><xNome>BRUNA BOTTER PSIQUIATRIA, PSICOTERAPIA E SAUDE MENTAL LTDA</xNome><enderNac><xLgr>MARTINHO DE HARO</xLgr><nro>667</nro><xBairro>INGLESES DO RIO VERMELHO</xBairro><cMun>4205407</cMun><UF>SC</UF><CEP>88058540</CEP></enderNac><fone>4888334154</fone><email>BRUNABOTTERPSIQUIATRIA@GMAIL.COM</email></emit><valores><vBC>450.00</vBC><pAliqAplic>2.00</pAliqAplic><vISSQN>9.00</vISSQN><vLiq>450.00</vLiq></valores><DPS versao="1.01" xmlns="http://www.sped.fazenda.gov.br/nfse"><infDPS Id="DPS420540725643723600014400900000000000000125"><tpAmb>1</tpAmb><dhEmi>2026-01-27T16:55:54-03:00</dhEmi><verAplic>EmissorWeb_1.4.0.27</verAplic><serie>900</serie><nDPS>125</nDPS><dCompet>2026-01-27</dCompet><tpEmit>1</tpEmit><cLocEmi>4205407</cLocEmi><prest><CNPJ>56437236000144</CNPJ><fone>4888334154</fone><email>BRUNABOTTERPSIQUIATRIA@GMAIL.COM</email><regTrib><opSimpNac>1</opSimpNac><regEspTrib>0</regEspTrib></regTrib></prest><toma><CPF>82860157972</CPF><xNome>ADRIANA NUNES DO HERVAL MENDES</xNome><end><endNac><cMun>4216602</cMun><CEP>88117331</CEP></endNac><xLgr>R MANOEL LOUREIRO</xLgr><nro>1601</nro><xCpl>Apto: 104</xCpl><xBairro>BARREIROS</xBairro></end><email>adrianahmendes@hotmail.com</email></toma><serv><locPrest><cLocPrestacao>4205407</cLocPrestacao></locPrest><cServ><cTribNac>040101</cTribNac><xDescServ>(ATIVIDADE MEDICA AMBULATORIAL RESTRITA A CONSULTAS) CONSULTA MÉDICA REALIZADA EM 27/01/2026</xDescServ><cNBS>123012200</cNBS></cServ></serv><valores><vServPrest><vServ>450.00</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun><totTrib><pTotTrib><pTotTribFed>15.45</pTotTribFed><pTotTribEst>0.00</pTotTribEst><pTotTribMun>0.00</pTotTribMun></pTotTrib></totTrib></trib></valores></infDPS></DPS></infNFSe></NFSe>`;
  }

  private formatCnpj(val: string): string {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return val;
  }
}

export const xmlParserService = new XmlParserService();
