const { layout } = require('../../templates/layout');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');
const { atualizarSePreciso } = require('../../utils/bolsa');

function fmt(v) {
  if (v >= 1000) return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

module.exports = {
  name: 'comprar-btc',
  categoria: 'bolsa',

  async execute({ sock, msg, from, sender, args }) {
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'comprar-btc',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'comprar-btc',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !comprar-btc 0.5'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const qtd = parseFloat(args[0].replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      const texto = layout({
        comando: 'comprar-btc',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Quantidade inválida!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const bolsa = atualizarSePreciso();
    const btc = bolsa.moedas.BTC;
    const total = btc.valor * qtd;

    const { grupo } = getUserGrupo(sender, groupId);
    if (grupo.carteira < total) {
      const texto = layout({
        comando: 'comprar-btc',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: [
          `🌑 Precisa: ${fmt(total)}`,
          `🌑 Você tem: ${fmt(grupo.carteira)}`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const moedas = grupo.moedas || {};
    moedas.BTC = (moedas.BTC || 0) + qtd;

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira - total,
      moedas,
    });

    const texto = layout({
      comando: 'comprar-btc',
      titulo: '🌑 𝐂𝐎𝐌𝐏𝐑𝐀 𝐁𝐓𝐂 🌑',
      linhas: [
        `🌑 𝙌𝙩𝙙: ${qtd} BTC`,
        `🌑 𝘾𝙤𝙩𝙖𝙘̧𝙖̃𝙤: ${fmt(btc.valor)}`,
        `🌑 𝙏𝙤𝙩𝙖𝙡: ${fmt(total)}`,
        `🌑 𝙎𝙖𝙡𝙙𝙤: ${fmt(grupo.carteira - total)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
