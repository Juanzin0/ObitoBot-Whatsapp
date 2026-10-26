const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

const MIN = 100;
const MAX = 300;
const COOLDOWN = 24 * 60 * 60 * 1000; // 24h

module.exports = {
  name: 'diario',
  categoria: 'economia',

  async execute({ sock, msg, from, sender }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'diario',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O diário só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const { grupo } = getUserGrupo(sender, groupId);
    const agora = Date.now();
    const diario = grupo.recompensas.diario || { ultimoUso: 0, diasConsecutivos: 0 };

    if (agora - diario.ultimoUso < COOLDOWN) {
      const restante = COOLDOWN - (agora - diario.ultimoUso);
      const h = Math.floor(restante / 3600000);
      const m = Math.floor((restante % 3600000) / 60000);
      const texto = layout({
        comando: 'diario',
        titulo: '🌑 𝐄𝐒𝐏𝐄𝐑𝐄 🌑',
        linhas: [`🌑 Volte em: ${h}h ${m}min`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ultimo = new Date(diario.ultimoUso);
    const mesmoDia = ultimo.getDate() === ontem.getDate()
      && ultimo.getMonth() === ontem.getMonth()
      && ultimo.getFullYear() === ontem.getFullYear();

    const streak = mesmoDia ? diario.diasConsecutivos + 1 : 1;
    const bonus = Math.min(streak * 0.01, 0.10);
    const ganhoBase = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    const ganho = Math.floor(ganhoBase * (1 + bonus));

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira + ganho,
      recompensas: {
        ...grupo.recompensas,
        diario: { ultimoUso: agora, diasConsecutivos: streak },
      },
    });

    const texto = layout({
      comando: 'diario',
      titulo: '🌑 𝐃𝐈𝐀́𝐑𝐈𝐎 🌑',
      linhas: [
        `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
        `🌑 𝘿𝙄𝘼𝙎 𝙎𝙀𝙂𝙐𝙄𝘿𝙊𝙎: ${streak}`,
        `🌑 𝘽𝙊̂𝙉𝙐𝙎: ${Math.round(bonus * 100)}%`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
