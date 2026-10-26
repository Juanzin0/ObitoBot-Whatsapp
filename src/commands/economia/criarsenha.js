const { layout } = require('../../templates/layout');
const { getUser, updateUser } = require('../../utils/database');

module.exports = {
  name: 'criarsenha',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona no PV
    if (from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'criarsenha',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐏𝐕 🌑',
        linhas: ['🌑 Esse comando só funciona no privado do bot.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const senha = (args[0] || '').trim();

    if (!/^\d{4}$/.test(senha)) {
      const texto = layout({
        comando: 'criarsenha',
        titulo: '🌑 𝐒𝐄𝐍𝐇𝐀 𝐈𝐍𝐕Á𝐋𝐈𝐃𝐀 🌑',
        linhas: [
          '🌑 A senha precisa ter exatamente 4 dígitos.',
          '🌑 Ex: !criarsenha 1234',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const user = getUser(sender);

    if (user.senha) {
      const texto = layout({
        comando: 'criarsenha',
        titulo: '🌑 𝐉Á 𝐓𝐄𝐌 𝐒𝐄𝐍𝐇𝐀 🌑',
        linhas: [
          '🌑 Você já tem uma senha cadastrada.',
          '🌑 Pra trocar, use !trocarsenha <antiga> <nova>',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUser(sender, { senha, senhaTentativas: 0, senhaBloqueadoAte: 0 });

    const texto = layout({
      comando: 'criarsenha',
      titulo: '🌑 𝐒𝐄𝐍𝐇𝐀 𝐂𝐑𝐈𝐀𝐃𝐀 🌑',
      linhas: [
        '🌑 Senha cadastrada com sucesso!',
        '🌑 Agora use !carteira no PV pra ver tudo.',
      ],
    });
    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
