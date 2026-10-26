const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getAllUsers } = require('../../utils/database');

module.exports = {
  name: 'grupobank',
  categoria: 'banco',

  async execute({ sock, msg, from }) {
    const users = getAllUsers();

    const totalBanco = users.reduce((acc, u) => acc + (u.banco || 0), 0);
    const totalCarteira = users.reduce((acc, u) => acc + (u.carteira || 0), 0);
    const totalUsers = users.length;

    const comDivida = users.filter(u => u.dividaBanco && !u.dividaBanco.pago && u.dividaBanco.valor > 0);
    const totalDividas = comDivida.reduce((acc, u) => acc + u.dividaBanco.valor, 0);

    const texto = layout({
      comando: 'grupobank',
      titulo: '🌑 𝐎𝐁𝐈𝐓𝐎 𝐁𝐀𝐍𝐊 🌑',
      linhas: [
        `🌑 𝙐𝙎𝙐𝘼́𝙍𝙄𝙊𝙎: ${totalUsers}`,
        `🌑 𝙏𝙊𝙏𝘼𝙇 𝙉𝙊 𝘽𝘼𝙉𝘾𝙊: ${formatReal(totalBanco)}`,
        `🌑 𝙏𝙊𝙏𝘼𝙇 𝙀𝙈 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼𝙎: ${formatReal(totalCarteira)}`,
        `🌑 𝘿𝙄́𝙑𝙄𝘿𝘼𝙎 𝘼𝙏𝙄𝙑𝘼𝙎: ${comDivida.length}`,
        `🌑 𝙑𝘼𝙇𝙊𝙍 𝘿𝙀𝙑𝙄𝘿𝙊: ${formatReal(totalDividas)}`,
        '🌑 ─────────────',
        '🌑 𝙏𝘼𝙓𝘼 𝘿𝙀𝙋𝙊́𝙎𝙄𝙏𝙊: 5%',
        '🌑 𝙅𝙐𝙍𝙊𝙎 𝙀𝙈𝙋𝙍𝙀́𝙎𝙏𝙄𝙈𝙊: 10%',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
