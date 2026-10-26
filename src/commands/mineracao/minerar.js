const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo, todayStr } = require('../../utils/database');
const { getInventario, updateInventario, sortearMinerio } = require('../../utils/inventario');

const MAX_MINERACOES = 5;

function fmtTempo(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const minR = m % 60;
  if (h > 0) return `${h}h ${minR}min`;
  return `${minR}min`;
}

module.exports = {
  name: 'minerar',
  categoria: 'mineracao',

  async execute({ sock, msg, from, sender }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'minerar',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Minerar só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    let { grupo } = getUserGrupo(sender, groupId);

    // Reset se virou o dia
    const hoje = todayStr();
    if (grupo.dataMineracao !== hoje) {
      updateUserGrupo(sender, groupId, { mineracoesHoje: 0, dataMineracao: hoje });
      grupo = { ...grupo, mineracoesHoje: 0, dataMineracao: hoje };
    }

    if (grupo.mineracoesHoje >= MAX_MINERACOES) {
      const texto = layout({
        comando: 'minerar',
        titulo: '🌑 𝐃𝐄𝐒𝐂𝐀𝐍𝐒𝐎 🌑',
        linhas: [
          `🌑 Você já minerou ${MAX_MINERACOES}x hoje nesse grupo!`,
          '🌑 Volte amanhã.',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== SORTEIA =====
    const minerio = sortearMinerio();

    // ===== ATUALIZA INVENTÁRIO (GLOBAL — minério é do user, não do grupo) =====
    const inv = getInventario(sender);
    inv[minerio.nome] = (inv[minerio.nome] || 0) + 1;
    updateInventario(sender, inv);

    // ===== ATUALIZA CONTADOR DO GRUPO =====
    updateUserGrupo(sender, groupId, { mineracoesHoje: grupo.mineracoesHoje + 1 });

    const frases = [
      'A sorte favorece os persistentes!',
      'Minério encontrado nas profundezas!',
      'O trabalho duro compensa!',
      'A terra revelou seus tesouros!',
    ];
    const frase = frases[Math.floor(Math.random() * frases.length)];

    const texto = layout({
      comando: 'minerar',
      titulo: '🌑 𝐌𝐈𝐍𝐄𝐑𝐀𝐂̧𝐀̃𝐎 🌑',
      linhas: [
        `🌑 Você encontrou: ${minerio.emoji} ${minerio.exibicao.toUpperCase()}`,
        `🌑 𝙑𝙖𝙡𝙤𝙧: ${formatReal(minerio.valor)}`,
        `🌑 𝙍𝙖𝙧𝙞𝙙𝙖𝙙𝙚: ${minerio.estrelas} (${minerio.raridade})`,
        `🌑 𝙈𝙞𝙣𝙚𝙧𝙖𝙘̧𝙤̃𝙚𝙨: ${grupo.mineracoesHoje + 1}/${MAX_MINERACOES}`,
        '',
        `🌑 ${frase}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
