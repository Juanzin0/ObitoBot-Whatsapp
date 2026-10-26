const SUFIXOS = [
  { s: 'Dc', v: 1e33 }, { s: 'No', v: 1e30 }, { s: 'Oc', v: 1e27 },
  { s: 'Sp', v: 1e24 }, { s: 'Sx', v: 1e21 }, { s: 'Qi', v: 1e18 },
  { s: 'Qa', v: 1e15 }, { s: 'T',  v: 1e12 }, { s: 'B',  v: 1e9  },
  { s: 'M',  v: 1e6  }, { s: 'K',  v: 1e3  },
];

function parseMoeda(input) {
  if (typeof input === 'number') return Math.floor(input);
  if (!input) return NaN;
  const str = String(input).trim().replace(',', '.');
  const match = str.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (!match) return NaN;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return NaN;
  const sufixo = match[2];
  if (!sufixo) return Math.floor(num);
  const found = SUFIXOS.find(x => x.s === sufixo)
             || SUFIXOS.find(x => x.s.toLowerCase() === sufixo.toLowerCase());
  if (!found) return NaN;
  return Math.floor(num * found.v);
}

function formatMoeda(valor) {
  const n = Math.floor(valor);
  const abs = Math.abs(n);
  for (const { s, v } of SUFIXOS) {
    if (abs >= v) {
      const result = n / v;
      return Number.isInteger(result) ? `${result}${s}` : `${result.toFixed(1)}${s}`;
    }
  }
  return `${n}`;
}

// ===== NOVO: retorna com "coin" ou "coins" =====
function formatReal(valor) {
  const n = Math.floor(valor);
  const texto = formatMoeda(n);

  // Plural/singular automático (baseado no valor REAL, não no formatado)
  const plural = Math.abs(n) === 1 ? 'coin' : 'coins';

  return `${texto} ${plural}`;
}

module.exports = { parseMoeda, formatMoeda, formatReal };
