const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

module.exports = {
  name: 'pix',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args, mentioned }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'pix',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O pix só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!mentioned || mentioned.length === 0) {
      const texto = layout({
        comando: 'pix',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !pix @user 1k', '🌑 Ou: !pix 1k @user'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const alvo = mentioned[0];
    if (alvo === sender) {
      const texto = layout({
        comando: 'pix',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você não pode fazer pix pra si mesmo.'],
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
        comando: 'pix',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Valor inválido. Ex: !pix @user 1k'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo: grupoSender } = getUserGrupo(sender, groupId);
    const { grupo: grupoAlvo } = getUserGrupo(alvo, groupId);

    if (grupoSender.carteira < valor) {
      const texto = layout({
        comando: 'pix',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: [
          `🌑 Você tem apenas ${formatReal(grupoSender.carteira)}`,
          `🌑 Tentou enviar ${formatReal(valor)}`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUserGrupo(sender, groupId, { carteira: grupoSender.carteira - valor });
    updateUserGrupo(alvo, groupId, { carteira: grupoAlvo.carteira + valor });

    const nomeSender = msg.pushName || sender.split('@')[0];

    const texto = layout({
      comando: 'pix',
      titulo: '🌑 𝐏𝐈𝐗 🌑',
      linhas: [
        `🌑 𝘿𝙀: ${nomeSender}`,
        `🌑 𝙋𝘼𝙍𝘼: @${alvo.split('@')[0]}`,
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(valor)}`,
        `🌑 𝙎𝙀𝙐 𝙎𝘼𝙇𝘿𝙊: ${formatReal(grupoSender.carteira - valor)}`,
      ],
    });

    await sock.sendMessage(from, {
      text: texto,
      mentions: [alvo],
    }, { quoted: msg });
  }
};
