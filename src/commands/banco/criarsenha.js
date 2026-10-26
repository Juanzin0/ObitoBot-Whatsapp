const { layout } = require('../../templates/layout');
const { getUser, updateUser } = require('../../utils/database');

module.exports = {
  name: 'criarsenha',
  categoria: 'banco',

  async execute({ sock, msg, from, sender, args }) {
    const user = getUser(sender);

    if (user.senha) {
      const texto = layout({
        comando: 'criarsenha',
        titulo: '🌑 𝐉Á 𝐓𝐄𝐌 🌑',
        linhas: ['🌑 Você já tem uma senha cadastrada.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (!args[0] || !/^\d{4}$/.test(args[0])) {
      const texto = layout({
        comando: 'criarsenha',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [
          '🌑 Use: !criarsenha 1234',
          '🌑 A senha deve ter 4 dígitos.',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUser(sender, { senha: args[0] });

    const texto = layout({
      comando: 'criarsenha',
      titulo: '🌑 𝐒𝐄𝐍𝐇𝐀 🌑',
      linhas: [
        '🌑 Senha criada com sucesso!',
        '🌑 Nunca compartilhe com ninguém.',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
