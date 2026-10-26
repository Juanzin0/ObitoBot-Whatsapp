const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo } = require('../../utils/database');

module.exports = {
  name: 'banco',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, mentioned }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'banco',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O banco só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const alvo = mentioned && mentioned.length > 0 ? mentioned[0] : sender;
    const { global, grupo } = getUserGrupo(alvo, groupId);

    const divida = grupo.dividaBanco || { valor: 0, pago: true };
    const dividaTxt = !divida.pago
      ? `Ativa (${formatReal(divida.valor)})`
      : 'Nenhuma';

    const texto = layout({
      comando: 'banco',
      titulo: '🌑 𝐁𝐀𝐍𝐂𝐎 🌑',
      linhas: [
        `🌑 𝘿𝙊𝙉𝙊: @${alvo.split('@')[0]}`,
        `🌑 𝙍𝙂: ${global.rg}`,
        `🌑 𝙎𝘼𝙇𝘿𝙊: ${formatReal(grupo.banco || 0)}`,
        `🌑 𝘿𝙄𝙑𝙄𝘿𝘼: ${dividaTxt}`,
      ],
    });

    await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
  }
};
