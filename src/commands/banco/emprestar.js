const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const {
  getUser,
  getUserGrupo,
  updateUser,
  updateUserGrupo,
  getAllUsers,
  getNomeGrupoDB,
  rgSujo,
  sujarRG,
  limparRG,
} = require('../../utils/database');
const {
  setPendente,
  getPendente,
  limparPendente,
  adicionarEmprestimo,
  gerarId,
} = require('../../utils/emprestimos');
const { adicionar: addGrupoBank } = require('../../utils/grupobank');

const PRAZO_DIAS = 5;
const TAXA_FIXA_PV = 5;
const MAX_TENTATIVAS_VALOR = 15;

module.exports = {
  name: 'emprestar',
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
      comando: 'emprestar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 Seu RG está sujo!', '🌑 Não pode fazer empréstimos.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (!mentioned || mentioned.length === 0) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Use: !emprestar @user 1k 10'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const alvo = mentioned[0];
  if (alvo === sender) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Você não pode emprestar pra si mesmo.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (rgSujo(alvo)) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 O RG do alvo está sujo.'],
    });
    return sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
  }

  let valor = NaN;
  for (const a of args) {
    if (a.startsWith('@')) continue;
    const apenasDigitos = a.replace(/\D/g, '');
    if (apenasDigitos.length > MAX_TENTATIVAS_VALOR) continue;
    const limpo = a.replace(/[^0-9.,a-zA-Z]/g, '');
    const v = parseMoeda(limpo);
    if (!isNaN(v) && v > 0) { valor = v; break; }
  }

  if (isNaN(valor) || valor <= 0) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Valor inválido!'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  let juros = 0;
  for (const a of args) {
    if (a.startsWith('@')) continue;
    const apenasDigitos = a.replace(/\D/g, '');
    if (apenasDigitos.length > MAX_TENTATIVAS_VALOR) continue;
    const n = parseInt(a);
    if (!isNaN(n) && n >= 0 && n <= 100 && String(n) === a) { juros = n; break; }
  }

  const { grupo: grupoCredor } = getUserGrupo(sender, groupId);
  if (grupoCredor.carteira < valor) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
      linhas: [`🌑 Você tem: ${formatReal(grupoCredor.carteira)}`],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const totalPagar = juros > 0 ? Math.floor(valor + (valor * juros / 100)) : valor;
  const id = gerarId();

  setPendente(alvo, {
    tipo: 'emprestar_aceitar_grupo',
    emprestimo: {
      id,
      credor: sender,
      devedor: alvo,
      valor,
      juros,
      totalPagar,
      groupId,
      dataEmprestimo: Date.now(),
      prazo: PRAZO_DIAS,
      pago: false,
      expirado: false,
      origem: 'grupo',
    },
  });

  const nomeSender = msg.pushName || sender.split('@')[0];

  const texto = layout({
    comando: 'emprestar',
    titulo: '🌑 𝐏𝐄𝐃𝐈𝐃𝐎 𝐃𝐄 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 🌑',
    linhas: [
      `🌑 𝘾𝙍𝙀𝘿𝙊𝙍: ${nomeSender}`,
      `🌑 𝘿𝙀𝙑𝙀𝘿𝙊𝙍: @${alvo.split('@')[0]}`,
      `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(valor)}`,
      `🌑 𝙅𝙐𝙍𝙊𝙎: ${juros}%`,
      `🌑 𝙏𝙊𝙏𝘼𝙇: ${formatReal(totalPagar)}`,
      `🌑 𝙋𝙍𝘼𝙕𝙊: ${PRAZO_DIAS} dias`,
      '',
      `🌑 @${alvo.split('@')[0]}, responda:`,
      '🌑 *sim* pra aceitar',
      '🌑 *não* pra recusar',
      '🌑 (1 minuto pra responder)',
    ],
  });

  await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
}

// ═══════════════════════════════════════════════════════════
// MODO 2 — PV
// ═══════════════════════════════════════════════════════════
async function executarPV({ sock, msg, from, sender, args }) {
  if (args.length < 2) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: [
        '🌑 Use: !emprestar 000-000 1k',
        '🌑 Ou: !emprestar 000-000 1k 10',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (rgSujo(sender)) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 Seu RG está sujo! Não pode emprestar.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const rgAlvo = args[0].trim();
  if (!/^\d{3}-\d{3}$/.test(rgAlvo)) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 RG inválido. Formato: 000-000'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const valor = parseMoeda(args[1]);
  if (isNaN(valor) || valor <= 0) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Valor inválido!'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  let juros = TAXA_FIXA_PV;
  let taxaFixa = true;
  if (args[2]) {
    const n = parseInt(args[2]);
    if (!isNaN(n) && n >= 0 && n <= 100) {
      juros = n;
      taxaFixa = false;
    }
  }

  const todos = getAllUsers();
  const alvoUser = todos.find(u => u.rg === rgAlvo);

  if (!alvoUser) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐑𝐆 𝐍𝐀̃𝐎 𝐄𝐍𝐂𝐎𝐍𝐓𝐑𝐀𝐃𝐎 🌑',
      linhas: [
        `🌑 RG: ${rgAlvo}`,
        '🌑 Verifique os dados e tente de novo.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const alvoJid = alvoUser.jid;

  if (alvoJid === sender) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
      linhas: ['🌑 Você não pode emprestar pra si mesmo.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (rgSujo(alvoJid)) {
    const texto = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐑𝐆 𝐒𝐔𝐉𝐎 🌑',
      linhas: ['🌑 O RG do alvo está sujo.'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const nomeRemetente = getUser(sender).nome || sender.split('@')[0];

  setPendente(sender, {
    tipo: 'emprestar_confirmar_dados',
    emprestimo: {
      rgAlvo,
      alvoJid,
      valor,
      juros,
      taxaFixa,
      nomeRemetente,
    },
  });

  const texto = layout({
    comando: 'emprestar',
    titulo: '🌑 𝐂𝐎𝐍𝐅𝐈𝐑𝐌𝐀𝐑 𝐃𝐀𝐃𝐎𝐒 🌑',
    linhas: [
      `🌑 𝙍𝙂: ${rgAlvo}`,
      `🌑 𝙉𝙊𝙈𝙀 𝘿𝙊 𝙍𝙀𝙈𝙀𝙏𝙀𝙉𝙏𝙀: ${nomeRemetente}`,
      '',
      '🌑 Os dados estão certos?',
      '🌑 Responda *sim* ou *não*.',
      '🌑 (1 minuto)',
    ],
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

// ═══════════════════════════════════════════════════════════
// CAPTURA RESPOSTAS NO PV (chamado pelo index.js)
// ═══════════════════════════════════════════════════════════
async function tentarCapturarResposta({ sock, msg, from, sender }) {
  // Aceita tanto PV quanto grupo (o aceite do devedor no grupo cai aqui)
  const isPV = !from.endsWith('@g.us');

  const pendente = getPendente(sender);
  if (!pendente) return false;

  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    '';
  const resposta = texto.trim().toLowerCase();

  // ═══════════════════════════════════════════════════════════
  // DEVEDOR ACEITA (GRUPO)
  // ═══════════════════════════════════════════════════════════
  if (pendente.tipo === 'emprestar_aceitar_grupo') {
    if (resposta === 'não' || resposta === 'nao' || resposta === 'n') {
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
        linhas: ['🌑 Empréstimo recusado.'],
      });
      await sock.sendMessage(from, { text: t, mentions: [sender] });
      return true;
    }

    if (resposta !== 'sim' && resposta !== 's') return false;

    const emp = pendente.emprestimo;

    // Verifica saldo do credor de novo
    const { grupo: grupoCredor } = getUserGrupo(emp.credor, emp.groupId);
    if (grupoCredor.carteira < emp.valor) {
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐅𝐀𝐋𝐇𝐎𝐔 🌑',
        linhas: ['🌑 O credor não tem mais saldo suficiente.'],
      });
      await sock.sendMessage(from, { text: t });
      return true;
    }

    // Transfere
    updateUserGrupo(emp.credor, emp.groupId, { carteira: grupoCredor.carteira - emp.valor });
    const { grupo: grupoDevedor } = getUserGrupo(sender, emp.groupId);
    updateUserGrupo(sender, emp.groupId, { carteira: grupoDevedor.carteira + emp.valor });

    // Cria empréstimo
    adicionarEmprestimo(sender, emp);

    limparPendente(sender);

    const t = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
        `🌑 𝘿𝙀𝙑𝙀𝙍𝘼́: ${formatReal(emp.totalPagar)}`,
        `🌑 𝙋𝙍𝘼𝙕𝙊: ${PRAZO_DIAS} dias`,
      ],
    });
    await sock.sendMessage(from, { text: t, mentions: [sender] });

    // Notifica credor no PV
    try {
      await sock.sendMessage(emp.credor, {
        text: layout({
          comando: 'emprestar',
          titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
          linhas: [
            `🌑 @${sender.split('@')[0]} aceitou!`,
            `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
            `🌑 𝙍𝙀𝘾𝙀𝘽𝙀𝙍𝘼́: ${formatReal(emp.totalPagar)}`,
          ],
        }),
        mentions: [sender],
      });
    } catch {}

    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // DEVEDOR ACEITA (PV)
  // ═══════════════════════════════════════════════════════════
  if (pendente.tipo === 'emprestar_aceitar_pv') {
    if (resposta === 'não' || resposta === 'nao' || resposta === 'n') {
      // Devolve pro credor
      const emp = pendente.emprestimo;
      const { grupo } = getUserGrupo(emp.credor, pendente.grupoOrigem);
      updateUserGrupo(emp.credor, pendente.grupoOrigem, { carteira: grupo.carteira + emp.valor });

      limparPendente(sender);

      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
        linhas: ['🌑 Empréstimo recusado. Valor devolvido.'],
      });
      await sock.sendMessage(from, { text: t });

      // Notifica credor
      try {
        await sock.sendMessage(emp.credor, {
          text: layout({
            comando: 'emprestar',
            titulo: '🌑 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
            linhas: [`🌑 @${sender.split('@')[0]} recusou o empréstimo.`, '🌑 Valor devolvido.'],
          }),
          mentions: [sender],
        });
      } catch {}

      return true;
    }

    if (resposta !== 'sim' && resposta !== 's') return false;

    const emp = pendente.emprestimo;

    // Pega grupos do devedor
    const devedor = getUser(sender);
    const grupos = Object.keys(devedor.grupos || {}).filter(g => !g.startsWith('pv:'));

    if (grupos.length === 0) {
      // Devolve pro credor
      const { grupo } = getUserGrupo(emp.credor, pendente.grupoOrigem);
      updateUserGrupo(emp.credor, pendente.grupoOrigem, { carteira: grupo.carteira + emp.valor });
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você não está em nenhum grupo.'],
      });
      await sock.sendMessage(from, { text: t });
      return true;
    }

    // Se só 1 grupo, credita direto
    if (grupos.length === 1) {
      const gid = grupos[0];
      const { grupo } = getUserGrupo(sender, gid);
      updateUserGrupo(sender, gid, { banco: grupo.banco + emp.valor });
      adicionarEmprestimo(sender, emp);

      // Taxa fixa vai pro banco do bot
      if (emp.taxaFixa && emp.juros > 0) {
        const taxaValor = Math.floor(emp.valor * emp.juros / 100);
        if (taxaValor > 0) addGrupoBank(taxaValor, `Taxa (PV) - ${sender}`);
      }

      limparPendente(sender);

      const nomeG = getNomeGrupoDB(gid) || gid;
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐑𝐄𝐂𝐄𝐁𝐈𝐃𝐎 🌑',
        linhas: [
          `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
          `🌑 𝙂𝙍𝙐𝙋𝙊: ${nomeG}`,
          `🌑 𝘿𝙀𝙑𝙀𝙍𝘼́: ${formatReal(emp.totalPagar)}`,
        ],
      });
      await sock.sendMessage(from, { text: t });

      // Notifica credor
      try {
        await sock.sendMessage(emp.credor, {
          text: layout({
            comando: 'emprestar',
            titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
            linhas: [
              `🌑 @${sender.split('@')[0]} aceitou!`,
              `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
              `🌑 𝙍𝙀𝘾𝙀𝘽𝙀𝙍𝘼́: ${formatReal(emp.totalPagar)}`,
            ],
          }),
          mentions: [sender],
        });
      } catch {}

      return true;
    }

    // Vários grupos: pergunta
    setPendente(sender, {
      tipo: 'emprestar_escolher_grupo_devedor',
      emprestimo: emp,
      grupos,
    });

    const linhas = ['🌑 Pra qual grupo quer receber?', ''];
    grupos.forEach((gid, i) => {
      const nome = getNomeGrupoDB(gid) || gid;
      linhas.push(`🌑 ${i + 1}. ${nome}`);
    });
    linhas.push('', '🌑 Responda com o número.');

    const t = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐒𝐂𝐎𝐋𝐇𝐀 𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
      linhas,
    });
    await sock.sendMessage(from, { text: t });
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // DEVEDOR ESCOLHE GRUPO (PV)
  // ═══════════════════════════════════════════════════════════
  if (pendente.tipo === 'emprestar_escolher_grupo_devedor') {
    const n = parseInt(resposta);
    if (isNaN(n) || n < 1 || n > pendente.grupos.length) return false;

    const gid = pendente.grupos[n - 1];
    const emp = pendente.emprestimo;

    const { grupo } = getUserGrupo(sender, gid);
    updateUserGrupo(sender, gid, { banco: grupo.banco + emp.valor });
    adicionarEmprestimo(sender, emp);

    if (emp.taxaFixa && emp.juros > 0) {
      const taxaValor = Math.floor(emp.valor * emp.juros / 100);
      if (taxaValor > 0) addGrupoBank(taxaValor, `Taxa (PV) - ${sender}`);
    }

    limparPendente(sender);

    const nomeG = getNomeGrupoDB(gid) || gid;
    const t = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐑𝐄𝐂𝐄𝐁𝐈𝐃𝐎 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
        `🌑 𝙂𝙍𝙐𝙋𝙊: ${nomeG}`,
        `🌑 𝘿𝙀𝙑𝙀𝙍𝘼́: ${formatReal(emp.totalPagar)}`,
      ],
    });
    await sock.sendMessage(from, { text: t });

    try {
      await sock.sendMessage(emp.credor, {
        text: layout({
          comando: 'emprestar',
          titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
          linhas: [
            `🌑 @${sender.split('@')[0]} aceitou!`,
            `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
            `🌑 𝙂𝙍𝙐𝙋𝙊: ${nomeG}`,
          ],
        }),
        mentions: [sender],
      });
    } catch {}

    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIRMAR DADOS (CREDOR PV)
  // ═══════════════════════════════════════════════════════════
  if (pendente.tipo === 'emprestar_confirmar_dados') {
    if (resposta === 'não' || resposta === 'nao' || resposta === 'n') {
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐂𝐀𝐍𝐂𝐄𝐋𝐀𝐃𝐎 🌑',
        linhas: ['🌑 Operação cancelada.'],
      });
      await sock.sendMessage(from, { text: t });
      return true;
    }

    if (resposta !== 'sim' && resposta !== 's') return false;

    const credor = getUser(sender);
    const grupos = Object.keys(credor.grupos || {}).filter(g => !g.startsWith('pv:'));

    if (grupos.length === 0) {
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você não está em nenhum grupo.'],
      });
      await sock.sendMessage(from, { text: t });
      return true;
    }

    const emp = pendente.emprestimo;
    let temSaldo = false;
    for (const gid of grupos) {
      const g = credor.grupos[gid];
      if (g.carteira >= emp.valor) { temSaldo = true; break; }
    }

    if (!temSaldo) {
      limparPendente(sender);
      const t = layout({
        comando: 'emprestar',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: ['🌑 Você não tem saldo suficiente em nenhum grupo.'],
      });
      await sock.sendMessage(from, { text: t });
      return true;
    }

    if (grupos.length === 1) {
      await processarRetirada({ sock, from, sender, groupId: grupos[0], emp });
      return true;
    }

    setPendente(sender, {
      tipo: 'emprestar_escolher_grupo_credor',
      emprestimo: emp,
      grupos,
    });

    const linhas = ['🌑 De qual grupo quer retirar?', ''];
    grupos.forEach((gid, i) => {
      const nome = getNomeGrupoDB(gid) || gid;
      linhas.push(`🌑 ${i + 1}. ${nome}`);
    });
    linhas.push('', '🌑 Responda com o número.');

    const t = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐄𝐒𝐂𝐎𝐋𝐇𝐀 𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
      linhas,
    });
    await sock.sendMessage(from, { text: t });
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // CREDOR ESCOLHE GRUPO PRA RETIRAR
  // ═══════════════════════════════════════════════════════════
  if (pendente.tipo === 'emprestar_escolher_grupo_credor') {
    const n = parseInt(resposta);
    if (isNaN(n) || n < 1 || n > pendente.grupos.length) return false;

    const gid = pendente.grupos[n - 1];
    await processarRetirada({ sock, from, sender, groupId: gid, emp: pendente.emprestimo });
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════
// PROCESSA RETIRADA (credor) — depois de escolher grupo
// ═══════════════════════════════════════════════════════════
async function processarRetirada({ sock, from, sender, groupId, emp }) {
  const { grupo } = getUserGrupo(sender, groupId);
  if (grupo.carteira < emp.valor) {
    limparPendente(sender);
    const t = layout({
      comando: 'emprestar',
      titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
      linhas: ['🌑 Saldo insuficiente nesse grupo.'],
    });
    await sock.sendMessage(from, { text: t });
    return;
  }

  updateUserGrupo(sender, groupId, { carteira: grupo.carteira - emp.valor });

  const id = gerarId();
  emp.id = id;

  setPendente(emp.alvoJid, {
    tipo: 'emprestar_aceitar_pv',
    emprestimo: emp,
    grupoOrigem: groupId,
  });

  const nomeSender = getUser(sender).nome || sender.split('@')[0];

  try {
    await sock.sendMessage(emp.alvoJid, {
      text: layout({
        comando: 'emprestar',
        titulo: '🌑 𝐕𝐎𝐂𝐄̂ 𝐑𝐄𝐂𝐄𝐁𝐄𝐔 𝐔𝐌 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 🌑',
        linhas: [
          `🌑 𝘿𝙀: ${nomeSender}`,
          `🌑 𝙍𝙂: ${getUser(sender).rg}`,
          `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
          `🌑 𝙏𝙊𝙏𝘼𝙇 𝘼 𝙋𝘼𝙂𝘼𝙍: ${formatReal(emp.totalPagar)}`,
          '',
          '🌑 Confirma? Responda *sim* ou *não*.',
          '🌑 (1 minuto)',
        ],
      }),
    });
  } catch (e) {
    console.error('Erro ao enviar pedido pro devedor:', e.message);
    updateUserGrupo(sender, groupId, { carteira: grupo.carteira });
  }

  limparPendente(sender);

  const t = layout({
    comando: 'emprestar',
    titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 𝐄𝐍𝐕𝐈𝐀𝐃𝐎 🌑',
    linhas: [
      '🌑 Aguardando o devedor aceitar.',
      `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(emp.valor)}`,
    ],
  });
  await sock.sendMessage(from, { text: t });
}

module.exports.tentarCapturarResposta = tentarCapturarResposta;
