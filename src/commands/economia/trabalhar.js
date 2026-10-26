const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo, todayStr } = require('../../utils/database');
const { getProfissao, sortearSalario } = require('../../utils/profissoes');

const COOLDOWN_NORMAL = 60 * 60 * 1000;   // 1h
const COOLDOWN_EXTRA  = 2 * 60 * 60 * 1000; // 2h
const MAX_USOS = 3;

function isNoturno() {
  const h = new Date().getHours();
  return h >= 20 || h < 6;
}

function isFimDeSemana() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

module.exports = {
  name: 'trabalhar',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'trabalhar',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O trabalho só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const sub = (args[0] || '').toLowerCase();
    if (sub === 'extra')   return executarExtra({ sock, msg, from, sender });
    if (sub === 'noturno') return executarNoturno({ sock, msg, from, sender });
    return executarNormal({ sock, msg, from, sender });
  }
};

// ─── NORMAL ───────────────────────────────────────────────
async function executarNormal({ sock, msg, from, sender }) {
  const groupId = from;
  const { grupo } = getUserGrupo(sender, groupId);

  // ===== CHECA SE TÁ DESEMPREGADO =====
  if (grupo.profissaoIndex === 0) {
    const texto = layout({
      comando: 'trabalhar',
      titulo: '🌑 𝐃𝐄𝐒𝐄𝐌𝐏𝐑𝐄𝐆𝐀𝐃𝐎 🌑',
      linhas: [
        '🌑 Você ainda não tem emprego!',
        '🌑 Use !procuraremprego pra entrar',
        '🌑 no mercado de trabalho.',
        '',
        '🌑 Comece como Faxineiro e suba',
        '🌑 de cargo trabalhando!',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // ===== FIM DE SEMANA BLOQUEIA =====
  if (isFimDeSemana()) {
    const texto = layout({
      comando: 'trabalhar',
      titulo: '🌑 𝐅𝐈𝐌 𝐃𝐄 𝐒𝐄𝐌𝐀𝐍𝐀 🌑',
      linhas: [
        '🌑 Fim de semana é pra descansar!',
        '🌑 Use !horaextra se quiser trabalhar.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const agora = Date.now();
  const ultimo = grupo.ultimoTrabalho || 0;
  const diff = agora - ultimo;

  // Se passou 1h desde o último uso, reseta os usos
  let usos = grupo.trabalhosHoje || 0;
  if (diff >= COOLDOWN_NORMAL) {
    usos = 0;
  }

  // Se já usou os 3 e ainda não passou 1h, bloqueia
  if (usos >= MAX_USOS) {
    const restante = COOLDOWN_NORMAL - diff;
    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000);
    const texto = layout({
      comando: 'trabalhar',
      titulo: '🌑 𝐄𝐒𝐏𝐄𝐑𝐄 🌑',
      linhas: [
        `🌑 Você já trabalhou ${MAX_USOS}x!`,
        `🌑 Volte em: ${min}m ${seg}s`,
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const p = getProfissao(grupo.profissaoIndex);
  let ganho = sortearSalario(grupo.profissaoIndex);

  let extra = '';
  const rng = Math.random();
  if (rng < 0.05) {
    ganho *= 3;
    extra = '🎁 𝘽Ô𝙉𝙐𝙎! Você ganhou 3x!';
  } else if (rng < 0.15) {
    ganho = Math.floor(ganho / 2);
    extra = '💸 𝘿𝙀𝙐 𝙍𝙐𝙄𝙈! Ganhou só metade.';
  }

  const novoProgresso = grupo.progressoCarreira + ganho;
  const novaCarteira = grupo.carteira + ganho;

  const sortudo = Math.random() < 0.01;
  const bateuMeta = p.meta !== Infinity && novoProgresso >= p.meta;

  let novoIndex = grupo.profissaoIndex;
  let progressoFinal = novoProgresso;
  let subiuMsg = '';

  if (sortudo || bateuMeta) {
    novoIndex = Math.min(grupo.profissaoIndex + 1, 38);
    const novaP = getProfissao(novoIndex);
    progressoFinal = (bateuMeta && !sortudo) ? novoProgresso - p.meta : 0;
    subiuMsg = (sortudo && !bateuMeta)
      ? `🎉 𝙇𝙐𝘾𝙆! Promovido por sorte!\n🌑 ${p.nome} ➜ ${novaP.nome}`
      : `🎉 𝙋𝘼𝙍𝘼𝘽É𝙉𝙎! Bateu a meta!\n🌑 ${p.nome} ➜ ${novaP.nome}`;
  }

  updateUserGrupo(sender, groupId, {
    carteira: novaCarteira,
    ultimoTrabalho: agora,
    trabalhosHoje: usos + 1,
    profissaoIndex: novoIndex,
    progressoCarreira: progressoFinal,
  });

  const nvP = getProfissao(novoIndex);
  const metaTxt = nvP.meta === Infinity ? '∞' : formatReal(nvP.meta);

  const linhas = [
    `🌑 𝘾𝘼𝙍𝙂𝙊: ${nvP.nome}`,
    `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
  ];
  if (extra) linhas.push(`🌑 ${extra}`);
  linhas.push(`🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(novaCarteira)}`);
  linhas.push(`🌑 𝙋𝙍𝙊𝙂𝙍𝙀𝙎𝙎𝙊: ${formatReal(progressoFinal)} / ${metaTxt}`);
  linhas.push(`🌑 𝙐𝙎𝙊𝙎: ${usos + 1}/${MAX_USOS}`);
  if (subiuMsg) linhas.push('', subiuMsg);

  const texto = layout({
    comando: 'trabalhar',
    titulo: '🌑 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 🌑',
    linhas,
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

// ─── EXTRA ────────────────────────────────────────────────
async function executarExtra({ sock, msg, from, sender }) {
  const groupId = from;
  const { grupo } = getUserGrupo(sender, groupId);

  if (grupo.profissaoIndex === 0) {
    const texto = layout({
      comando: 'trabalhar extra',
      titulo: '🌑 𝐃𝐄𝐒𝐄𝐌𝐏𝐑𝐄𝐆𝐀𝐃𝐎 🌑',
      linhas: [
        '🌑 Você ainda não tem emprego!',
        '🌑 Use !procuraremprego primeiro.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (isFimDeSemana()) {
    const texto = layout({
      comando: 'trabalhar extra',
      titulo: '🌑 𝐅𝐈𝐌 𝐃𝐄 𝐒𝐄𝐌𝐀𝐍𝐀 🌑',
      linhas: ['🌑 Fim de semana é pra descansar!'],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const agora = Date.now();
  let usos = grupo.extraUsos;
  if (agora >= (grupo.extraReset || 0)) usos = 2;

  if (usos <= 0) {
    const restante = (grupo.extraReset || 0) - agora;
    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000);
    const texto = layout({
      comando: 'trabalhar extra',
      titulo: '🌑 𝐄𝐒𝐏𝐄𝐑𝐄 🌑',
      linhas: [`🌑 Sem usos. Reseta em: ${min}m ${seg}s`],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const p = getProfissao(grupo.profissaoIndex);
  const ganhoBase = sortearSalario(grupo.profissaoIndex);
  const ganho = ganhoBase * 2;

  const novosUsos = usos - 1;

  updateUserGrupo(sender, groupId, {
    carteira: grupo.carteira + ganho,
    extraUsos: novosUsos,
    extraReset: novosUsos === 0 ? agora + COOLDOWN_EXTRA : (grupo.extraReset || 0),
  });

  const texto = layout({
    comando: 'trabalhar extra',
    titulo: '🌑 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 𝐄𝐗𝐓𝐑𝐀 🌑',
    linhas: [
      `🌑 𝘾𝘼𝙍𝙂𝙊: ${p.nome}`,
      `🌑 𝙂𝘼𝙉𝙃𝙊 (2x): ${formatReal(ganho)}`,
      `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      `🌑 𝙐𝙎𝙊𝙎 𝙍𝙀𝙎𝙏𝘼𝙉𝙏𝙀𝙎: ${novosUsos}/2`,
    ],
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

// ─── NOTURNO ──────────────────────────────────────────────
async function executarNoturno({ sock, msg, from, sender }) {
  const groupId = from;
  const { grupo } = getUserGrupo(sender, groupId);

  if (grupo.profissaoIndex === 0) {
    const texto = layout({
      comando: 'trabalhar noturno',
      titulo: '🌑 𝐃𝐄𝐒𝐄𝐌𝐏𝐑𝐄𝐆𝐀𝐃𝐎 🌑',
      linhas: [
        '🌑 Você ainda não tem emprego!',
        '🌑 Use !procuraremprego primeiro.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  if (!isNoturno()) {
    const texto = layout({
      comando: 'trabalhar noturno',
      titulo: '🌑 𝐅𝐎𝐑𝐀 𝐃𝐄 𝐇𝐎𝐑Á𝐑𝐈𝐎 🌑',
      linhas: [
        '🌑 Trabalho noturno só das 20:00 às 06:00.',
        '🌑 Volte mais tarde.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const p = getProfissao(grupo.profissaoIndex);
  const ganho = sortearSalario(grupo.profissaoIndex);

  updateUserGrupo(sender, groupId, { carteira: grupo.carteira + ganho });

  const texto = layout({
    comando: 'trabalhar noturno',
    titulo: '🌑 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 𝐍𝐎𝐓𝐔𝐑𝐍𝐎 🌑',
    linhas: [
      `🌑 𝘾𝘼𝙍𝙂𝙊: ${p.nome}`,
      `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
      `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      '🌑 (não conta pra meta)',
    ],
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}
