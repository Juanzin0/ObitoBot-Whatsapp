function levenshtein(a, b) {
  a = String(a).toLowerCase();
  b = String(b).toLowerCase();

  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matriz = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matriz[i][0] = i;
  for (let j = 0; j <= n; j++) matriz[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo
      );
    }
  }

  return matriz[m][n];
}

function similaridade(a, b) {
  a = String(a).toLowerCase();
  b = String(b).toLowerCase();

  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const dist = levenshtein(a, b);
  return 1 - (dist / maxLen);
}

function acharComandoSimilar(digitado, listaComandos, limiteMinimo = 0.5) {
  let melhor = null;

  for (const cmd of listaComandos) {
    const sim = similaridade(digitado, cmd);
    if (sim >= limiteMinimo) {
      if (!melhor || sim > melhor.similaridade) {
        melhor = { nome: cmd, similaridade: sim };
      }
    }
  }

  return melhor;
}

module.exports = { levenshtein, similaridade, acharComandoSimilar };
