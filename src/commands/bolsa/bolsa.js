const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');
const { atualizarSePreciso } = require('../../utils/bolsa');

const EMOJIS = {
  BTC: '₿', EUR: '💶', USD: '💵', XAU: '🥇',
  XAG: '🥈', ETH: '💎', SOL: '☀️', XRP: '💠',
};

const NOMES = {
  BTC: 'Bitcoin', EUR: 'Euro', USD: 'Dólar', XAU: 'Ouro',
  XAG: 'Prata', ETH: 'Ethereum', SOL: 'Solana', XRP: 'Ripple',
};

function fmt(v) {
  if (v >= 1000) return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function sinal(v) {
  if (v > 0) return '🔺';
  if (v < 0) return '🔻';
  return '➖';
}

module.exports = {
  name: 'bolsa',
  categoria: 'bolsa',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'bolsa',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 A bolsa só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const bolsa = atualizarSePreciso();
    const moedas = bolsa.moedas;

    // ===== SEM ARGUMENTOS: LISTA =====
    if (!args[0]) {
      const ordenadas = Object.entries(moedas).sort((a, b) => b[1].valor - a[1].valor);
      const linhas = [];

      for (const [sigla, m] of ordenadas) {
        const e = EMOJIS[sigla] || '🪙';
        const s = sinal(m.variacao24h);
        linhas.push(`🌑 ${e} ${sigla}  ${fmt(m.valor)}  ${s} ${m.variacao24h.toFixed(1)}%`);
      }

      const data = new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const texto = layout({
        comando: 'bolsa',
        titulo: '🌑 𝐁𝐎𝐋𝐒𝐀 🌑',
        linhas: [
          ...linhas,
          '🌑 ─────────────',
          `🌑 𝘼𝙩𝙪𝙖𝙡𝙞𝙯𝙖𝙙𝙤: ${data}`,
        ],
      });

      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const sub = args[0].toLowerCase();

    // ===== COMPRAR =====
    if (sub === 'comprar' || sub === 'buy') {
      if (args.length < 3) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Use: !bolsa comprar BTC 0.5'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const sigla = args[1].toUpperCase();
      const qtd = parseFloat(args[2].replace(',', '.'));

      if (isNaN(qtd) || qtd <= 0) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Quantidade inválida!'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      if (!moedas[sigla]) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Moeda não encontrada!'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const moeda = moedas[sigla];
      const total = moeda.valor * qtd;

      const { grupo } = getUserGrupo(sender, groupId);
      if (grupo.carteira < total) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
          linhas: [
            `🌑 Precisa: ${fmt(total)}`,
            `🌑 Você tem: ${fmt(grupo.carteira)}`,
          ],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const moedasUser = grupo.moedas || {};
      moedasUser[sigla] = (moedasUser[sigla] || 0) + qtd;

      updateUserGrupo(sender, groupId, {
        carteira: grupo.carteira - total,
        moedas: moedasUser,
      });

      const texto = layout({
        comando: 'bolsa',
        titulo: '🌑 𝐂𝐎𝐌𝐏𝐑𝐀 🌑',
        linhas: [
          `🌑 ${EMOJIS[sigla]} ${sigla} (${NOMES[sigla]})`,
          `🌑 𝙌𝙩𝙙: ${qtd}`,
          `🌑 𝘾𝙤𝙩𝙖𝙘̧𝙖̃𝙤: ${fmt(moeda.valor)}`,
          `🌑 𝙏𝙤𝙩𝙖𝙡: ${fmt(total)}`,
          `🌑 𝙎𝙖𝙡𝙙𝙤: ${fmt(grupo.carteira - total)}`,
        ],
      });

      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== VENDER =====
    if (sub === 'vender' || sub === 'sell') {
      if (args.length < 3) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Use: !bolsa vender BTC 0.5'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const sigla = args[1].toUpperCase();
      const qtd = parseFloat(args[2].replace(',', '.'));

      if (isNaN(qtd) || qtd <= 0) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Quantidade inválida!'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      if (!moedas[sigla]) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Moeda não encontrada!'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const { grupo } = getUserGrupo(sender, groupId);
      const moedasUser = grupo.moedas || {};
      const tem = moedasUser[sigla] || 0;

      if (tem < qtd) {
        const texto = layout({
          comando: 'bolsa',
          titulo: '🌑 𝐒𝐄𝐌 𝐌𝐎𝐄𝐃𝐀 🌑',
          linhas: [`🌑 Você tem apenas ${tem} ${sigla}`],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      const moeda = moedas[sigla];
      const total = moeda.valor * qtd;

      moedasUser[sigla] = tem - qtd;

      updateUserGrupo(sender, groupId, {
        carteira: grupo.carteira + total,
        moedas: moedasUser,
      });

      const texto = layout({
        comando: 'bolsa',
        titulo: '🌑 𝐕𝐄𝐍𝐃𝐀 🌑',
        linhas: [
          `🌑 ${EMOJIS[sigla]} ${sigla} (${NOMES[sigla]})`,
          `🌑 𝙌𝙩𝙙: ${qtd}`,
          `🌑 𝘾𝙤𝙩𝙖𝙘̧𝙖̃𝙤: ${fmt(moeda.valor)}`,
          `🌑 𝙏𝙤𝙩𝙖𝙡: ${fmt(total)}`,
          `🌑 𝙎𝙖𝙡𝙙𝙤: ${fmt(grupo.carteira + total)}`,
        ],
      });

      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== COTAÇÃO ESPECÍFICA =====
    const sigla = args[0].toUpperCase();
    if (!moedas[sigla]) {
      const texto = layout({
        comando: 'bolsa',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Moeda não encontrada!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const m = moedas[sigla];
    const s = sinal(m.variacao24h);
    const cor = m.variacao24h > 0 ? '🟢' : m.variacao24h < 0 ? '🔴' : '🟡';

    const texto = layout({
      comando: 'bolsa',
      titulo: `🌑 𝐁𝐎𝐋𝐒𝐀 - ${sigla} 🌑`,
      linhas: [
        `🌑 ${EMOJIS[sigla]} ${sigla} - ${NOMES[sigla]}`,
        `🌑 ${cor} ${fmt(m.valor)}  ${s} ${m.variacao24h.toFixed(1)}%`,
        `🌑 𝙑𝙤𝙡𝙖𝙩𝙞𝙡𝙞𝙙𝙖𝙙𝙚: ${m.volatilidade}%`,
        '🌑 ─────────────',
        `🌑 Comprar: !bolsa comprar ${sigla} 1`,
        `🌑 Vender: !bolsa vender ${sigla} 1`,
      ],
    });

    return sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
