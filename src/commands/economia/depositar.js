const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

const TAXA = 5; // 5%

module.exports = {
  name: 'depositar',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'depositar',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Depósito só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'depositar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !depositar 1k', '🌑 Ou: !depositar 5000'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const valor = parseMoeda(args[0]);
    if (isNaN(valor) || valor <= 0) {
      const texto = layout({
        comando: 'depositar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Valor inválido!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo } = getUserGrupo(sender, groupId);

    if (grupo.carteira < valor) {
      const texto = layout({
        comando: 'depositar',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: [
          `🌑 Você tem: ${formatReal(grupo.carteira)}`,
          `🌑 Tentou depositar: ${formatReal(valor)}`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const taxa = Math.floor(valor * TAXA / 100);
    const creditado = valor - taxa;

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira - valor,
      banco: (grupo.banco || 0) + creditado,
    });

    const texto = layout({
      comando: 'depositar',
      titulo: '🌑 𝐃𝐄𝐏𝐎́𝐒𝐈𝐓𝐎 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(valor)}`,
        `🌑 𝙏𝘼𝙓𝘼 (${TAXA}%): ${formatReal(taxa)}`,
        `🌑 𝘾𝙍𝙀́𝘿𝙄𝙏𝙊: ${formatReal(creditado)}`,
        `🌑 𝘽𝘼𝙉𝘾𝙊: ${formatReal((grupo.banco || 0) + creditado)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
