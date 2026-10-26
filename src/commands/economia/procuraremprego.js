const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');
const { getProfissao } = require('../../utils/profissoes');

module.exports = {
  name: 'procuraremprego',
  categoria: 'economia',

  async execute({ sock, msg, from, sender }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'procuraremprego',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const { grupo } = getUserGrupo(sender, groupId);

    if (grupo.profissaoIndex > 0) {
      const p = getProfissao(grupo.profissaoIndex);
      const texto = layout({
        comando: 'procuraremprego',
        titulo: '🌑 𝐉Á 𝐓𝐄𝐌 𝐄𝐌𝐏𝐑𝐄𝐆𝐎 🌑',
        linhas: [
          `🌑 Você já trabalha como ${p.nome}.`,
          '🌑 Suba de cargo usando !trabalhar!',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // Contrata como Faxineiro (index 1)
    updateUserGrupo(sender, groupId, { profissaoIndex: 1, progressoCarreira: 0 });
    const p = getProfissao(1);

    const texto = layout({
      comando: 'procuraremprego',
      titulo: '🌑 𝐄𝐌𝐏𝐑𝐄𝐆𝐎 🌑',
      linhas: [
        '🌑 Parabéns! Você foi contratado!',
        `🌑 𝘾𝘼𝙍𝙂𝙊: ${p.nome}`,
        `🌑 𝘿𝙄𝘼𝙍𝙄𝘼: R$ ${p.diaria[0]} – R$ ${p.diaria[1]}`,
        `🌑 𝙈𝙀𝙏𝘼: ${formatReal(p.meta)}`,
        '',
        '🌑 Agora use !trabalhar pra começar.',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
