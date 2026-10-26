const { layout } = require('../../templates/layout');

module.exports = {
  name: 'ia',
  categoria: 'utilidades',

  async execute({ sock, msg, from }) {
    const texto = layout({
      comando: 'ia',
      titulo: '🌑 𝐈𝐀 𝐃𝐄𝐒𝐀𝐓𝐈𝐕𝐀𝐃𝐀 🌑',
      linhas: [
        '🌑 A integração com IA foi removida desta versão pública.',
        '🌑 Nenhuma API externa é chamada por este comando.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
