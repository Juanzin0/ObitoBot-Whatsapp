const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const {
  getUser,
  getUserGrupo,
  updateUser,
  updateUserGrupo,
  getAllUsers,
  getNomeGrupoDB,
  rgSujo,
  limparRG,
} = require('../../utils/database');
const {
  setPendente,
  getPendente,
  limparPendente,
  listarEmprestimos,
  marcarPago,
} = require('../../utils/emprestimos');

module.exports = {
  name: 'pagar',
  categoria: 'banco',

  async execute({ sock, msg, from, sender, args, mentioned }) {
    const isPV = !from.endsWith('@g.us');
    if (isPV) return executarPV({ sock, msg, from, sender, args });
    return executarGrupo({ sock, msg, from, sender, args, mentioned });
  }
};

// ═══════════════════════════════════════════════════════════
// MODO 1 — GRUPO
// ═══════════════════════════════════════════════════════════
async function executarGrupo({ sock, msg, from, sender, args, mentioned }) {
  const groupId = from;

  if (rgSujo(sender)) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 Seu RG está sujo! Quite suas dívidas primeiro.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const { grupo } = getUserGrupo(sender, groupId);

  // ===== PAGAR BANCO =====
  if (args[0] && ['banco', 'bank'].includes(args[0].toLowerCase())) {
    const divida = grupo.dividaBanco || { valor: 0, pago: true };
    if (divida.pago || divida.valor <= 0) {
      const texto = layout({
        comando: 'pagar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você não tem dívida com o banco nesse grupo.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (grupo.carteira < divida.valor) {
      const texto = layout({
        comando: 'pagar',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: [
          `🌑 Precisa: ${formatReal(divida.valor)}`,
          `🌑 Você tem: ${formatReal(grupo.carteira)}`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira - divida.valor,
      dividaBanco: { valor: 0, dataEmprestimo: 0, prazo: 5, pago: true },
    });

    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐏𝐀𝐆𝐀𝐌𝐄𝐍𝐓𝐎 🌑',
      linhas: [
        `🌑 𝙋𝘼𝙂𝙊𝙐: ${formatReal(divida.valor)}`,
        '🌑 𝘿𝙄́𝙑𝙄𝘿𝘼 𝙌𝙐𝙄𝙏𝘼𝘿𝘼! ✅',
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira - divida.valor)}`,
      ],
    });

    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // ===== PAGAR USER (por @ ou RG) =====
  let alvo = null;
  let emp = null;

  // Se mencionou
  if (mentioned && mentioned.length > 0) {
    alvo = mentioned[0];
  } else if (args[0] && /^\d{3}-\d{3}$/.test(args[0])) {
    // Se mandou RG
    const todos = getAllUsers();
    const alvoUser = todos.find(u => u.rg === args[0]);
    if (!alvoUser) {
      const texto = layout({
        comando: 'pagar',
        titulo: '🌑 𝐑𝐆 𝐍𝐀̃𝐎 𝐄𝐍𝐂𝐎𝐍𝐓𝐑𝐀𝐃𝐎 🌑',
        linhas: [`🌑 RG: ${args[0]}`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }
    alvo = alvoUser.jid;
  }

  if (!alvo) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: [
        '🌑 Use: !pagar banco',
        '🌑 Ou: !pagar @user',
        '🌑 Ou: !pagar 000-000',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // Busca empréstimo do devedor com esse credor
  const emprestimos = listarEmprestimos(sender);
  const empEncontrado = emprestimos.find(e => !e.pago && e.credor === alvo);

  if (!empEncontrado) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: [`🌑 Você não deve nada pra @${alvo.split('@')[0]}`],
    });
    return sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
  }

  if (grupo.carteira < empEncontrado.totalPagar) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
      linhas: [
        `🌑 Você deve: ${formatReal(empEncontrado.totalPagar)}`,
        `🌑 Você tem: ${formatReal(grupo.carteira)}`,
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // ===== PAGA =====
  updateUserGrupo(sender, groupId, { carteira: grupo.carteira - empEncontrado.totalPagar });
  marcarPago(sender, empEncontrado.id);

  // Credor recebe no banco do grupo atual (se tiver grupo)
  const { grupo: grupoCredor } = getUserGrupo(alvo, groupId);
  updateUserGrupo(alvo, groupId, { banco: grupoCredor.banco + empEncontrado.totalPagar });

  // Se o devedor tinha RG sujo, limpa
  if (rgSujo(sender)) limparRG(sender);

  const texto = layout({
    comando: 'pagar',
    titulo: '🌑 𝐏𝐀𝐆𝐀𝐌𝐄𝐍𝐓𝐎 🌑',
    linhas: [
      `🌑 𝙋𝘼𝙂𝙊𝙐: ${formatReal(empEncontrado.totalPagar)}`,
      `🌑 𝙋𝘼𝙍𝘼: @${alvo.split('@')[0]}`,
      '🌑 𝘿𝙄́𝙑𝙄𝘿𝘼 𝙌𝙐𝙄𝙏𝘼𝘿𝘼! ✅',
    ],
  });

  // Notifica credor no PV
  try {
    await sock.sendMessage(alvo, {
      text: layout({
        comando: 'pagar',
        titulo: '🌑 𝐏𝐀𝐆𝐀𝐌𝐄𝐍𝐓𝐎 𝐑𝐄𝐂𝐄𝐁𝐈𝐃𝐎 🌑',
        linhas: [
          `🌑 @${sender.split('@')[0]} te pagou!`,
          `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(empEncontrado.totalPagar)}`,
          `🌑 𝘾𝘼𝙄𝙐 𝙉𝙊 𝘽𝘼𝙉𝘾𝙊 do grupo.`,
        ],
      }),
      mentions: [sender],
    });
  } catch {}

  await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
}

// ═══════════════════════════════════════════════════════════
// MODO 2 — PV (!pagar [rg])
// ═══════════════════════════════════════════════════════════
async function executarPV({ sock, msg, from, sender, args }) {
  if (!args[0] || !/^\d{3}-\d{3}$/.test(args[0])) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Use: !pagar 000-000'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (rgSujo(sender)) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 Seu RG está sujo! Quite suas dívidas primeiro.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const rgCredor = args[0];

  // Procura o credor pelo RG
  const todos = getAllUsers();
  const credorUser = todos.find(u => u.rg === rgCredor);
  if (!credorUser) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐑𝐆 𝐍𝐀̃𝐎 𝐄𝐍𝐂𝐎𝐍𝐓𝐑𝐀𝐃𝐎 🌑',
      linhas: [`🌑 RG: ${rgCredor}`],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const credorJid = credorUser.jid;

  // Busca empréstimo
  const emprestimos = listarEmprestimos(sender);
  const emp = emprestimos.find(e => !e.pago && e.credor === credorJid);

  if (!emp) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: [`🌑 Você não deve nada pra RG ${rgCredor}`],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // Pega grupos do devedor
  const devedor = getUser(sender);
  const grupos = Object.keys(devedor.grupos || {}).filter(g => !g.startsWith('pv:'));

  if (grupos.length === 0) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Você não está em nenhum grupo.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // Verifica se tem saldo em algum grupo
  let temSaldo = false;
  for (const gid of grupos) {
    const g = devedor.grupos[gid];
    if (g.carteira >= emp.totalPagar) { temSaldo = true; break; }
  }

  if (!temSaldo) {
    const texto = layout({
      comando: 'pagar',
      titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
      linhas: [`🌑 Você precisa de ${formatReal(emp.totalPagar)} em algum grupo.`],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // Se só 1 grupo, paga direto
  if (grupos.length === 1) {
    await processarPagamentoPV({ sock, from, sender, groupId: grupos[0], emp, credorJid });
    return;
  }

  // Se vários, pergunta
  setPendente(sender, {
    tipo: 'pagar_escolher_grupo',
    emprestimoId: emp.id,
    credorJid,
    grupos,
  });

  const linhas = ['🌑 De qual grupo quer pagar a dívida?', ''];
  grupos.forEach((gid, i) => {
    const nome = getNomeGrupoDB(gid) || gid;
    linhas.push(`🌑 ${i + 1}. ${nome}`);
  });
  linhas.push('', '🌑 Responda com o número.');

  const texto = layout({
    comando: 'pagar',
    titulo: '🌑 𝐄𝐒𝐂𝐎𝐋𝐇𝐀 𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
    linhas,
  });
  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

// ═══════════════════════════════════════════════════════════
// PROCESSA PAGAMENTO PV
// ═══════════════════════════════════════════════════════════
async function processarPagamentoPV({ sock, from, sender, groupId, emp, credorJid }) {
  const { grupo } = getUserGrupo(sender, groupId);
  if (grupo.carteira < emp.totalPagar) {
    const t = layout({
      comando: 'pagar',
      titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
      linhas: ['🌑 Saldo insuficiente nesse grupo.'],
    });
    await sock.sendMessage(from, { text: t });
    return;
  }

  updateUserGrupo(sender, groupId, { carteira: grupo.carteira - emp.totalPagar });
  marcarPago(sender, emp.id);

  // Credor recebe no banco
  const { grupo: grupoCredor } = getUserGrupo(credorJid, groupId);
  updateUserGrupo(credorJid, groupId, { banco: grupoCredor.banco + emp.totalPagar });

  // Limpa RG sujo se tiver
  if (rgSujo(sender)) limparRG(sender);

  const nomeG = getNomeGrupoDB(groupId) || groupId;

  await sock.sendMessage(from, {
    text: layout({
      comando: 'pagar',
      titulo: '🌑 𝐏𝐀𝐆𝐀𝐌𝐄𝐍𝐓𝐎 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.totalPagar)}`,
        `🌑 𝙂𝙍𝙐𝙋𝙊: ${nomeG}`,
        '🌑 𝘿𝙄́𝙑𝙄𝘿𝘼 𝙌𝙐𝙄𝙏𝘼𝘿𝘼! ✅',
      ],
    }),
  });

  // Notifica credor
  try {
    await sock.sendMessage(credorJid, {
      text: layout({
        comando: 'pagar',
        titulo: '🌑 𝐏𝐀𝐆𝐀𝐌𝐄𝐍𝐓𝐎 𝐑𝐄𝐂𝐄𝐁𝐈𝐃𝐎 🌑',
        linhas: [
          `🌑 @${sender.split('@')[0]} te pagou!`,
          `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.totalPagar)}`,
          `🌑 𝙂𝙍𝙐𝙋𝙊: ${nomeG}`,
        ],
      }),
      mentions: [sender],
    });
  } catch {}
}

// ═══════════════════════════════════════════════════════════
// CAPTURA RESPOSTAS NO PV (chamado pelo index.js)
// ═══════════════════════════════════════════════════════════
async function tentarCapturarResposta({ sock, msg, from, sender }) {
  if (from.endsWith('@g.us')) return false;

  const pendente = getPendente(sender);
  if (!pendente) return false;

  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    '';
  const resposta = texto.trim().toLowerCase();

  // ===== ESCOLHER GRUPO PRA PAGAR =====
  if (pendente.tipo === 'pagar_escolher_grupo') {
    const n = parseInt(resposta);
    if (isNaN(n) || n < 1 || n > pendente.grupos.length) return false;

    const gid = pendente.grupos[n - 1];
    const emprestimos = listarEmprestimos(sender);
    const emp = emprestimos.find(e => e.id === pendente.emprestimoId);

    if (!emp) {
      limparPendente(sender);
      await sock.sendMessage(from, {
        text: layout({
          comando: 'pagar',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Empréstimo não encontrado.'],
        }),
      });
      return true;
    }

    await processarPagamentoPV({ sock, from, sender, groupId: gid, emp, credorJid: pendente.credorJid });
    limparPendente(sender);
    return true;
  }

  return false;
}

module.exports.tentarCapturarResposta = tentarCapturarResposta;
