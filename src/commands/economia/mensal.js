const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

const MIN = 5000;
const MAX = 15000;
const COOLDOWN = 30 * 24 * 60 * 60 * 1000;

module.exports = {
  name: 'mensal',
  categoria: 'economia',

  async execute({ sock, msg, from, sender }) {
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'mensal',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O mensal só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const { grupo } = getUserGrupo(sender, groupId);
    const agora = Date.now();
    const mensal = grupo.recompensas.mensal || { ultimoUso: 0 };

    if (agora - mensal.ultimoUso < COOLDOWN) {
      const restante = COOLDOWN - (agora - mensal.ultimoUso);
      const d = Math.floor(restante / 86400000);
      const texto = layout({
        comando: 'mensal',
        titulo: '🌑 𝐄𝐒𝐏𝐄𝐑𝐄 🌑',
        linhas: [`🌑 Volte em: ${d} dias`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const ganho = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira + ganho,
      recompensas: {
        ...grupo.recompensas,
        mensal: { ultimoUso: agora },
      },
    });

    const texto = layout({
      comando: 'mensal',
      titulo: '🌑 𝐌𝐄𝐍𝐒𝐀𝐋 🌑',
      linhas: [
        `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
