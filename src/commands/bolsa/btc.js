const { layout } = require('../../templates/layout');
const { atualizarSePreciso } = require('../../utils/bolsa');

function fmt(v) {
  if (v >= 1000) return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function tendencia(v) {
  if (v > 2) return '🔥 BTC em ALTA!';
  if (v > 0.5) return '📈 BTC em leve alta.';
  if (v < -2) return '📉 BTC em BAIXA!';
  if (v < -0.5) return '📉 BTC em leve baixa.';
  return '📊 BTC estável.';
}

module.exports = {
  name: 'btc',
  categoria: 'bolsa',

  async execute({ sock, msg, from }) {
    const bolsa = atualizarSePreciso();
    const btc = bolsa.moedas.BTC;

    const s = btc.variacao24h > 0 ? '🔺' : btc.variacao24h < 0 ? '🔻' : '➖';
    const cor = btc.variacao24h > 0 ? '🟢' : btc.variacao24h < 0 ? '🔴' : '🟡';

    const texto = layout({
      comando: 'btc',
      titulo: '🌑 𝐁𝐈𝐓𝐂𝐎𝐈𝐍 🌑',
      linhas: [
        '🌑 ₿ Bitcoin (BTC)',
        `🌑 ${cor} ${fmt(btc.valor)}`,
        `🌑 ${s} Variação: ${btc.variacao24h.toFixed(1)}%`,
        `🌑 📊 Volatilidade: ${btc.volatilidade}%`,
        `🌑 💬 ${tendencia(btc.variacao24h)}`,
        '🌑 ─────────────',
        '🌑 Compre: !bolsa comprar BTC 0.5',
        '🌑 Venda: !bolsa vender BTC 0.5',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
