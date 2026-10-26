const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getInventario, MINERIOS, ORDEM } = require('../../utils/inventario');

module.exports = {
  name: 'inventario',
  categoria: 'mineracao',

  async execute({ sock, msg, from, sender }) {
    const inv = getInventario(sender);

    let total = 0;
    let valorTotal = 0;

    for (const m of MINERIOS) {
      const qtd = inv[m.nome] || 0;
      total += qtd;
      valorTotal += qtd * m.valor;
    }

    const linhas = [`🌑 𝙏𝙤𝙩𝙖𝙡: ${total} 𝙢𝙞𝙣𝙚́𝙧𝙞𝙤𝙨`, '🌑'];

    let tem = false;
    for (const nome of ORDEM) {
      const qtd = inv[nome] || 0;
      if (qtd > 0) {
        const m = MINERIOS.find(x => x.nome === nome);
        linhas.push(`🌑 ${m.emoji} ${m.exibicao.toUpperCase()}: ${qtd}`);
        tem = true;
      }
    }

    if (!tem) {
      linhas.push('🌑 📭 Nenhum minério encontrado');
    }

    linhas.push('🌑');
    linhas.push(`🌑 💰 𝙑𝙖𝙡𝙤𝙧 𝙩𝙤𝙩𝙖𝙡: ${formatReal(valorTotal)}`);

    const texto = layout({
      comando: 'inventario',
      titulo: '🌑 𝐈𝐍𝐕𝐄𝐍𝐓𝐀́𝐑𝐈𝐎 🌑',
      linhas,
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
