const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const {
  getUser,
  getUserGrupo,
  updateUser,
  getNomeGrupoDB,
  loadDB,
} = require('../../utils/database');
const {
  marcarEsperando,
  estaEsperando,
  limparEspera,
} = require('../../utils/senhaEstado');

const MOEDAS = {
  BTC: { nome: 'Bitcoin', emoji: '₿' },
  EUR: { nome: 'Euro', emoji: '💶' },
  USD: { nome: 'Dólar', emoji: '💵' },
  XAU: { nome: 'Ouro', emoji: '🥇' },
  XAG: { nome: 'Prata', emoji: '🥈' },
  ETH: { nome: 'Ethereum', emoji: '💎' },
  SOL: { nome: 'Solana', emoji: '☀️' },
  XRP: { nome: 'Ripple', emoji: '💠' },
};

module.exports = {
  name: 'carteira',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args, mentioned }) {
    const isPV = !from.endsWith('@g.us');
    if (isPV) return executarPV({ sock, msg, from, sender, args });
    return executarGrupo({ sock, msg, from, sender, mentioned });
  }
};

// ═══════════════════════════════════════════════════════════
// GRUPO
// ═══════════════════════════════════════════════════════════
async function executarGrupo({ sock, msg, from, sender, mentioned }) {
  const alvo = mentioned && mentioned.length > 0 ? mentioned[0] : sender;
  const groupId = from;
  const { global, grupo } = getUserGrupo(alvo, groupId);

  const escudoTxt = grupo.escudo ? `Ativo (${grupo.escudo.usos} usos)` : 'Nenhum';

  const moedasComSaldo = Object.entries(grupo.moedas || {})
    .filter(([, qtd]) => qtd > 0)
    .sort((a, b) => b[1] - a[1]);

  const linhas = [
    `🌑 𝘿𝙊𝙉𝙊: @${alvo.split('@')[0]}`,
    `🌑 𝙍𝙂: ${global.rg}`,
    `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira)}`,
    `🌑 𝘽𝘼𝙉𝘾𝙊: ${formatReal(grupo.banco || 0)}`,
    `🌑 𝙀𝙎𝘾𝙐𝘿𝙊: ${escudoTxt}`,
  ];

  if (grupo.dividaBanco && !grupo.dividaBanco.pago && grupo.dividaBanco.valor > 0) {
    linhas.push(`🌑 📉 𝘿Í𝙑𝙄𝘿𝘼: ${formatReal(grupo.dividaBanco.valor)}`);
  }

  if (moedasComSaldo.length > 0) {
    linhas.push('🌑 ─────────────');
    for (const [sigla, qtd] of moedasComSaldo) {
      const info = MOEDAS[sigla];
      if (!info) continue;
      linhas.push(`🌑 ${info.emoji} ${info.nome.toUpperCase()}: ${qtd.toLocaleString('pt-BR')}`);
    }
  }

  const texto = layout({
    comando: 'carteira',
    titulo: '🌑 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 🌑',
    linhas,
  });

  await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
}

// ═══════════════════════════════════════════════════════════
// PV
// ═══════════════════════════════════════════════════════════
async function executarPV({ sock, msg, from, sender, args }) {
  const user = getUser(sender);

  if (!user.senha) {
    const texto = layout({
      comando: 'carteira',
      titulo: '🌑 𝐒𝐄𝐌 𝐒𝐄𝐍𝐇𝐀 🌑',
      linhas: [
        '🌑 Você ainda não criou uma senha.',
        '🌑 Use !criarsenha 1234 primeiro.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const agora = Date.now();
  if (user.senhaBloqueadoAte && agora < user.senhaBloqueadoAte) {
    const restante = user.senhaBloqueadoAte - agora;
    const min = Math.floor(restante / 60000);
    const seg = Math.floor((restante % 60000) / 1000);
    const texto = layout({
      comando: 'carteira',
      titulo: '🌑 𝐁𝐋𝐎𝐐𝐔𝐄𝐀𝐃𝐎 🌑',
      linhas: [
        '🌑 Acesso bloqueado por muitas tentativas erradas.',
        `🌑 Libera em: ${min}m ${seg}s`,
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const senhaDigitada = (args[0] || '').trim();

  if (!senhaDigitada) {
    marcarEsperando(sender);
    const texto = layout({
      comando: 'carteira',
      titulo: '🌑 𝐒𝐄𝐍𝐇𝐀 🌑',
      linhas: [
        '🌑 Qual é a sua senha?',
        '🌑 Manda ela aí (4 dígitos).',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  return validarSenha({ sock, msg, from, sender, senhaDigitada });
}

// ═══════════════════════════════════════════════════════════
// CAPTURA SENHA (chamado pelo index.js quando chega msg no PV)
// ═══════════════════════════════════════════════════════════
async function tentarCapturarSenha({ sock, msg, from, sender }) {
  if (from.endsWith('@g.us')) return false;
  if (!estaEsperando(sender)) return false;

  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    '';
  const senhaDigitada = texto.trim();

  if (!/^\d{4}$/.test(senhaDigitada)) return false;

  limparEspera(sender);
  await validarSenha({ sock, msg, from, sender, senhaDigitada });
  return true;
}

// ═══════════════════════════════════════════════════════════
// VALIDA SENHA E MOSTRA
// ═══════════════════════════════════════════════════════════
async function validarSenha({ sock, msg, from, sender, senhaDigitada }) {
  const user = getUser(sender);
  const agora = Date.now();

  if (senhaDigitada !== user.senha) {
    const tentativas = (user.senhaTentativas || 0) + 1;
    if (tentativas >= 3) {
      updateUser(sender, {
        senhaTentativas: 0,
        senhaBloqueadoAte: agora + 60 * 60 * 1000,
      });
      const texto = layout({
        comando: 'carteira',
        titulo: '🌑 𝐁𝐋𝐎𝐐𝐔𝐄𝐀𝐃𝐎 🌑',
        linhas: [
          '🌑 3 tentativas erradas!',
          '🌑 Acesso bloqueado por 1 hora.',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    updateUser(sender, { senhaTentativas: tentativas });
    marcarEsperando(sender);
    const texto = layout({
      comando: 'carteira',
      titulo: '🌑 𝐒𝐄𝐍𝐇𝐀 𝐄𝐑𝐑𝐀𝐃𝐀 🌑',
      linhas: [
        `🌑 Tentativa ${tentativas}/3`,
        '🌑 Manda a senha de novo.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  // ===== SENHA CORRETA =====
  updateUser(sender, { senhaTentativas: 0 });
  limparEspera(sender);

  const db = loadDB();
  const userDb = db[user.jid];
  const grupos = userDb?.grupos || {};

  if (Object.keys(grupos).length === 0) {
    const texto = layout({
      comando: 'carteira',
      titulo: '🌑 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 🌑',
      linhas: [
        `🌑 𝙉𝙊𝙈𝙀: ${user.nome || user.jid.split('@')[0]}`,
        `🌑 𝙍𝙂: ${user.rg}`,
        '',
        '🌑 Você ainda não tem dados em nenhum grupo.',
      ],
    });
    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }

  const linhas = [
    `🌑 𝙉𝙊𝙈𝙀: ${user.nome || user.jid.split('@')[0]}`,
    `🌑 𝙍𝙂: ${user.rg}`,
  ];

  // Ignora PVs
  const gruposReais = Object.keys(grupos).filter(gid => !gid.startsWith('pv:'));

  for (const gid of gruposReais) {
    const g = grupos[gid];
    const nomeG = getNomeGrupoDB(gid) || gid;
    linhas.push('');
    linhas.push(`🌑 ─── 🌑 ${nomeG} ───`);
    linhas.push(`🌑 💰 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(g.carteira)}`);
    linhas.push(`🌑 🏦 𝘽𝘼𝙉𝘾𝙊: ${formatReal(g.banco || 0)}`);

    const moedasComSaldo = Object.entries(g.moedas || {})
      .filter(([, qtd]) => qtd > 0);
    if (moedasComSaldo.length > 0) {
      const lista = moedasComSaldo.map(([s, q]) => `${s} ${q}`).join(', ');
      linhas.push(`🌑 🪙 𝙈𝙊𝙀𝘿𝘼𝙎: ${lista}`);
    }

    if (g.dividaBanco && !g.dividaBanco.pago && g.dividaBanco.valor > 0) {
      linhas.push(`🌑 📉 𝘿Í𝙑𝙄𝘿𝘼: ${formatReal(g.dividaBanco.valor)}`);
    }
  }

  const texto = layout({
    comando: 'carteira',
    titulo: '🌑 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 𝐆𝐋𝐎𝐁𝐀𝐋 🌑',
    linhas,
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports.tentarCapturarSenha = tentarCapturarSenha;
