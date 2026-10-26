const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getAllUsers } = require('../../utils/database');

module.exports = {
  name: 'rank',
  categoria: 'economia',

  async execute({ sock, msg, from }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'rank',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O rank só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const users = getAllUsers();

    // Filtra só quem tem dados NESSE grupo
    const lista = users
      .filter(u => u.grupos && u.grupos[groupId])
      .map(u => {
        const g = u.grupos[groupId];
        return {
          jid: u.jid,
          nome: u.nome || u.jid.split('@')[0],
          total: (g.carteira || 0) + (g.banco || 0),
        };
      })
      .filter(u => u.total > 0) // só quem tem saldo
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (lista.length === 0) {
      const texto = layout({
        comando: 'rank',
        titulo: '🌑 𝐑𝐀𝐍𝐊 🌑',
        linhas: ['🌑 Nenhum usuário com saldo nesse grupo ainda.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const linhas = [];
    for (let i = 0; i < lista.length; i++) {
      const u = lista[i];
      const emoji = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅';
      linhas.push(`${emoji} ${i + 1}. @${u.jid.split('@')[0]} — ${formatReal(u.total)}`);
    }

    const texto = layout({
      comando: 'rank',
      titulo: '🌑 𝐓𝐎𝐏 𝟏𝟎 🌑',
      linhas,
    });

    const mentions = lista.map(u => u.jid);
    await sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
  }
};
