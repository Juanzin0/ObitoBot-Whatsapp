const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const { getUser, getUserGrupo, updateUser, updateUserGrupo } = require('../../utils/database');

const PRAZO = 5;
const JUROS = 10;
const MIN = 100;

module.exports = {
  name: 'emprestimo',
  categoria: 'banco',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Empréstimo só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !emprestimo 1k'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const valor = parseMoeda(args[0]);
    if (isNaN(valor) || valor < MIN) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [`🌑 Valor mínimo: ${formatReal(MIN)}`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { global, grupo } = getUserGrupo(sender, groupId);

    if (!global.rg) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você precisa de um RG. Use !carteira.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (!global.senha) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Crie uma senha primeiro: !criarsenha 1234'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const divida = grupo.dividaBanco || { valor: 0, pago: true };
    if (!divida.pago && divida.valor > 0) {
      const texto = layout({
        comando: 'emprestimo',
        titulo: '🌑 𝐃𝐈́𝐕𝐈𝐃𝐀 🌑',
        linhas: [
          `🌑 Você já tem dívida ativa: ${formatReal(divida.valor)}`,
          '🌑 Pague antes: !pagar banco',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const totalPagar = Math.floor(valor + (valor * JUROS / 100));

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira + valor,
      dividaBanco: {
        valor: totalPagar,
        dataEmprestimo: Date.now(),
        prazo: PRAZO,
        pago: false,
      },
    });

    const texto = layout({
      comando: 'emprestimo',
      titulo: '🌑 𝐄𝐌𝐏𝐑𝐄́𝐒𝐓𝐈𝐌𝐎 🌑',
      linhas: [
        `🌑 𝙑𝘼𝙇𝙊𝙍: ${formatReal(valor)}`,
        `🌑 𝙅𝙐𝙍𝙊𝙎: ${JUROS}%`,
        `🌑 𝙏𝙊𝙏𝘼𝙇: ${formatReal(totalPagar)}`,
        `🌑 𝙋𝙍𝘼𝙕𝙊: ${PRAZO} dias`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + valor)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
