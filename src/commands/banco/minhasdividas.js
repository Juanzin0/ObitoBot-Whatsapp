const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo } = require('../../utils/database');

function tempoRestante(dataEmprestimo, prazo) {
  const agora = Date.now();
  const prazoMs = prazo * 24 * 60 * 60 * 1000;
  const t = (dataEmprestimo + prazoMs) - agora;
  if (t <= 0) return 'Expirado';
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

module.exports = {
  name: 'minhasdividas',
  categoria: 'banco',

  async execute({ sock, msg, from, sender }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'minhasdividas',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const { grupo } = getUserGrupo(sender, groupId);

    const dividaBanco = grupo.dividaBanco || { valor: 0, pago: true };
    const temDividaBanco = !dividaBanco.pago && dividaBanco.valor > 0;

    const emprestimos = grupo.emprestimos || [];
    const comoDevedor = emprestimos.filter(e => !e.pago && e.devedor === sender);

    if (!temDividaBanco && comoDevedor.length === 0) {
      const texto = layout({
        comando: 'minhasdividas',
        titulo: '🌑 𝐃𝐈́𝐕𝐈𝐃𝐀𝐒 🌑',
        linhas: ['🌑 Você não tem dívidas pendentes nesse grupo! 🎉'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const linhas = [];

    if (temDividaBanco) {
      const t = tempoRestante(dividaBanco.dataEmprestimo, dividaBanco.prazo);
      linhas.push('🌑 🏦 𝘽𝘼𝙉𝘾𝙊');
      linhas.push(`🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(dividaBanco.valor)}`);
      linhas.push(`🌑 𝙋𝙍𝘼𝙕𝙊: ${t}`);
      linhas.push('🌑');
    }

    for (const emp of comoDevedor) {
      const t = tempoRestante(emp.dataEmprestimo, emp.prazo || 3);
      linhas.push(`🌑 🤝 @${emp.credor.split('@')[0]}`);
      linhas.push(`🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.totalPagar)}`);
      linhas.push(`🌑 𝙋𝙍𝘼𝙕𝙊: ${t}`);
      linhas.push(`🌑 𝙄𝘿: ${emp.id}`);
      linhas.push('🌑');
    }

    const texto = layout({
      comando: 'minhasdividas',
      titulo: '🌑 𝐃𝐈́𝐕𝐈𝐃𝐀𝐒 🌑',
      linhas,
    });

    const mentions = comoDevedor.map(e => e.credor);
    await sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
  }
};
