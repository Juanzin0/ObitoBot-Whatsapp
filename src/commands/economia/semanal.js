const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

const MIN = 1000;
const MAX = 3000;
const COOLDOWN = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  name: 'semanal',
  categoria: 'economia',

  async execute({ sock, msg, from, sender }) {
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'semanal',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O semanal só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const { grupo } = getUserGrupo(sender, groupId);
    const agora = Date.now();
    const semanal = grupo.recompensas.semanal || { ultimoUso: 0 };

    if (agora - semanal.ultimoUso < COOLDOWN) {
      const restante = COOLDOWN - (agora - semanal.ultimoUso);
      const d = Math.floor(restante / 86400000);
      const h = Math.floor((restante % 86400000) / 3600000);
      const texto = layout({
        comando: 'semanal',
        titulo: '🌑 𝐄𝐒𝐏𝐄𝐑𝐄 🌑',
        linhas: [`🌑 Volte em: ${d}d ${h}h`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const ganho = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira + ganho,
      recompensas: {
        ...grupo.recompensas,
        semanal: { ultimoUso: agora },
      },
    });

    const texto = layout({
      comando: 'semanal',
      titulo: '🌑 𝐒𝐄𝐌𝐀𝐍𝐀𝐋 🌑',
      linhas: [
        `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
