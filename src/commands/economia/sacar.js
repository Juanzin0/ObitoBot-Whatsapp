const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

module.exports = {
  name: 'sacar',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'sacar',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Saque só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'sacar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !sacar 1k', '🌑 Ou: !sacar 5000'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== PROCURA O VALOR =====
    let valor = NaN;
    for (const a of args) {
      if (a.startsWith('@')) continue;
      const apenasDigitos = a.replace(/\D/g, '');
      if (apenasDigitos.length > 15) continue;

      const limpo = a.replace(/[^0-9.,a-zA-Z]/g, '');
      const v = parseMoeda(limpo);
      if (!isNaN(v) && v > 0) { valor = v; break; }
    }

    if (isNaN(valor) || valor <= 0) {
      const texto = layout({
        comando: 'sacar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Valor inválido!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo } = getUserGrupo(sender, groupId);

    if ((grupo.banco || 0) < valor) {
      const texto = layout({
        comando: 'sacar',
        titulo: '🌑 𝐒𝐄𝐌 𝐒𝐀𝐋𝐃𝐎 🌑',
        linhas: [
          `🌑 Banco: ${formatReal(grupo.banco || 0)}`,
          `🌑 Tentou sacar: ${formatReal(valor)}`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUserGrupo(sender, groupId, {
      banco: grupo.banco - valor,
      carteira: grupo.carteira + valor,
    });

    const texto = layout({
      comando: 'sacar',
      titulo: '🌑 𝐒𝐀𝐐𝐔𝐄 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(valor)}`,
        `🌑 𝘽𝘼𝙉𝘾𝙊: ${formatReal(grupo.banco - valor)}`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + valor)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
