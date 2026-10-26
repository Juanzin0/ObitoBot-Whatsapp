
const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, getAllUsers } = require('../../utils/database');
const { getProfissao } = require('../../utils/profissoes');
const { getPatente } = require('../../utils/patentes');

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
  name: 'perfil',
  categoria: 'utilidades',

  async execute({ sock, msg, from, sender, mentioned }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'perfil',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 O perfil só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const alvo = mentioned && mentioned.length > 0 ? mentioned[0] : sender;
    const { global, grupo } = getUserGrupo(alvo, groupId);

    const nome = global.nome || alvo.split('@')[0];
    const carteira = grupo.carteira || 0;
    const banco = grupo.banco || 0;
    const total = carteira + banco;

    const patente = getPatente(carteira);
    const profissao = getProfissao(grupo.profissaoIndex || 0);

    // ===== RANK (do grupo) =====
    const users = getAllUsers()
      .filter(u => u.grupos && u.grupos[groupId])
      .map(u => {
        const g = u.grupos[groupId];
        return {
          jid: u.jid,
          total: (g.carteira || 0) + (g.banco || 0),
        };
      })
      .filter(u => u.total > 0)
      .sort((a, b) => b.total - a.total);

    const posicao = users.findIndex(u => u.jid === alvo) + 1;
    const totalUsers = users.length;

    // ===== CRYPTOS =====
    const cryptosComSaldo = Object.entries(grupo.moedas || {})
      .filter(([, qtd]) => qtd > 0)
      .sort((a, b) => b[1] - a[1]);

    // ===== MONTA LINHAS =====
    const linhas = [
      `🌑 𝙉𝙊𝙈𝙀: ${nome}`,
      `🌑 𝙍𝙂: ${global.rg}`,
      `🌑 𝙋𝘼𝙏𝙀𝙉𝙏𝙀: ${patente.nome}`,
      `🌑 𝘾𝘼𝙍𝙂𝙊: ${profissao.nome}`,
      '',
      `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(carteira)}`,
      `🌑 𝘽𝘼𝙉𝘾𝙊: ${formatReal(banco)}`,
      `🌑 𝙏𝙊𝙏𝘼𝙇: ${formatReal(total)}`,
    ];

    if (cryptosComSaldo.length > 0) {
      linhas.push('');
      linhas.push('🌑 𝘾𝙍𝙔𝙋𝙏𝙊𝙈𝙊𝙀𝘿𝘼𝙎:');
      for (const [sigla, qtd] of cryptosComSaldo) {
        const info = MOEDAS[sigla];
        if (!info) continue;
        linhas.push(`🌑 ${info.emoji} ${info.nome.toUpperCase()}: ${qtd.toLocaleString('pt-BR')}`);
      }
    }

    linhas.push('');
    linhas.push(`🌑 𝙈𝙀𝙉𝙎𝘼𝙂𝙀𝙉𝙎: ${(grupo.totalMensagens || 0).toLocaleString('pt-BR')}`);
    linhas.push(`🌑 𝘾𝙊𝙈𝘼𝙉𝘿𝙊𝙎: ${(grupo.totalComandos || 0).toLocaleString('pt-BR')}`);

    if (posicao > 0) {
      linhas.push('');
      linhas.push(`🌑 𝙍𝘼𝙉𝙆: #${posicao} de ${totalUsers}`);
    }

    const texto = layout({
      comando: 'perfil',
      titulo: '🌑 𝐏𝐄𝐑𝐅𝐈𝐋 🌑',
      linhas,
    });

    // ===== PEGA FOTO: do user ou do bot =====
    let fotoUrl = null;
    try { fotoUrl = await sock.profilePictureUrl(alvo, 'image'); } catch {}

    if (!fotoUrl) {
      try {
        const botJid = sock.user?.id;
        if (botJid) fotoUrl = await sock.profilePictureUrl(botJid, 'image');
      } catch {}
    }

    if (fotoUrl) {
      await sock.sendMessage(from, {
        image: { url: fotoUrl },
        caption: texto,
        mentions: [alvo],
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
    }
  }
};
