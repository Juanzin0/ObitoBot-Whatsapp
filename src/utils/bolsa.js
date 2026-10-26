const fs = require('fs');
const path = require('path');

const BOLSA_PATH = path.join(__dirname, '..', 'database', 'bolsa.json');

const TEMPO_ATUALIZACAO = 30 * 60 * 1000; // 30 min

// ===== MOEDAS INICIAIS =====
const MOEDAS_INICIAIS = {
  BTC: { valor: 350000, volatilidade: 3 },
  EUR: { valor: 6.20, volatilidade: 0.5 },
  USD: { valor: 5.70, volatilidade: 0.5 },
  XAU: { valor: 12000, volatilidade: 1.5 },
  XAG: { valor: 180, volatilidade: 2 },
  ETH: { valor: 18000, volatilidade: 4 },
  SOL: { valor: 900, volatilidade: 5 },
  XRP: { valor: 3.50, volatilidade: 4 },
};

function bolsaInicial() {
  const agora = Date.now();
  const moedas = {};
  const historico = {};

  for (const [sigla, dados] of Object.entries(MOEDAS_INICIAIS)) {
    moedas[sigla] = {
      valor: dados.valor,
      volatilidade: dados.volatilidade,
      ultimaAtualizacao: agora,
      variacao24h: 0,
    };
    historico[sigla] = [dados.valor];
  }

  return {
    moedas,
    historico,
    ultimaAtualizacao: agora,
  };
}

function loadBolsa() {
  if (!fs.existsSync(BOLSA_PATH)) {
    fs.mkdirSync(path.dirname(BOLSA_PATH), { recursive: true });
    const inicial = bolsaInicial();
    fs.writeFileSync(BOLSA_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  try {
    return JSON.parse(fs.readFileSync(BOLSA_PATH, 'utf8'));
  } catch {
    const inicial = bolsaInicial();
    fs.writeFileSync(BOLSA_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
}

function saveBolsa(bolsa) {
  fs.writeFileSync(BOLSA_PATH, JSON.stringify(bolsa, null, 2));
}

// ===== ATUALIZA COTAÇÕES SE PASSAR DO TEMPO =====
function atualizarSePreciso() {
  const bolsa = loadBolsa();
  const agora = Date.now();

  if (agora - bolsa.ultimaAtualizacao < TEMPO_ATUALIZACAO) {
    return bolsa;
  }

  for (const [sigla, moeda] of Object.entries(bolsa.moedas)) {
    const valorAntigo = moeda.valor;
    const variacaoPercentual = (Math.random() * moeda.volatilidade * 2) - moeda.volatilidade;
    const novoValor = Math.max(moeda.valor * (1 + variacaoPercentual / 100), 0.01);

    moeda.valor = Math.round(novoValor * 10000) / 10000;
    moeda.ultimaAtualizacao = agora;
    moeda.variacao24h = ((moeda.valor - valorAntigo) / valorAntigo) * 100;

    if (!bolsa.historico[sigla]) bolsa.historico[sigla] = [];
    bolsa.historico[sigla].push(moeda.valor);
    if (bolsa.historico[sigla].length > 20) bolsa.historico[sigla].shift();
  }

  bolsa.ultimaAtualizacao = agora;
  saveBolsa(bolsa);
  return bolsa;
}

module.exports = { loadBolsa, saveBolsa, atualizarSePreciso, TEMPO_ATUALIZACAO, MOEDAS_INICIAIS };
