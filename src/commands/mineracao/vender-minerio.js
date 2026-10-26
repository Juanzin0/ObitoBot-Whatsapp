const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');
const { getInventario, updateInventario, getMinerio, MINERIOS, ORDEM } = require('../../utils/inventario');

module.exports = {
  name: 'vender-minerio',
  categoria: 'mineracao',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [
          '🌑 Use: !vender-minerio carvao 5',
          '🌑 Ou: !vender-minerio all',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo } = getUserGrupo(sender, groupId);
    const inv = getInventario(sender);

    // ===== VENDER TUDO =====
    if (args[0].toLowerCase() === 'all') {
      let totalVendido = 0;
      let valorTotal = 0;
      const itensVendidos = [];

      for (const nome of ORDEM) {
        const qtd = inv[nome] || 0;
        if (qtd > 0) {
          const m = MINERIOS.find(x => x.nome === nome);
          totalVendido += qtd;
          valorTotal += qtd * m.valor;
          itensVendidos.push(`${m.emoji} ${m.exibicao.toUpperCase()}: ${qtd}`);
          inv[nome] = 0;
        }
      }

      if (totalVendido === 0) {
        const texto = layout({
          comando: 'vender-minerio',
          titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
          linhas: ['🌑 Você não tem minérios pra vender!'],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      updateInventario(sender, inv);
      updateUserGrupo(sender, groupId, { carteira: grupo.carteira + valorTotal });

      const linhas = [
        '🌑 𝙄𝙩𝙚𝙣𝙨 𝙫𝙚𝙣𝙙𝙞𝙙𝙤𝙨:',
        ...itensVendidos.map(i => `🌑   ${i}`),
        '🌑',
        `🌑 𝙏𝙤𝙩𝙖𝙡 𝙙𝙚 𝙞𝙩𝙚𝙣𝙨: ${totalVendido}`,
        `🌑 𝙏𝙤𝙩𝙖𝙡: ${formatReal(valorTotal)}`,
        `🌑 𝙎𝙖𝙡𝙙𝙤: ${formatReal(grupo.carteira + valorTotal)}`,
      ];

      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐕𝐄𝐍𝐃𝐀 𝐓𝐎𝐓𝐀𝐋 🌑',
        linhas,
      });

      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== VENDER ESPECÍFICO =====
    if (!args[1]) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !vender-minerio carvao 5'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const nome = args[0].toLowerCase();
    const qtd = parseInt(args[1]);

    if (isNaN(qtd) || qtd <= 0) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Quantidade inválida!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const minerio = getMinerio(nome);
    if (!minerio) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Minério não encontrado!'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const disponivel = inv[minerio.nome] || 0;
    if (disponivel < qtd) {
      const texto = layout({
        comando: 'vender-minerio',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [`🌑 Você tem apenas ${disponivel} ${minerio.exibicao}`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const valorTotal = minerio.valor * qtd;
    inv[minerio.nome] = disponivel - qtd;

    updateInventario(sender, inv);
    updateUserGrupo(sender, groupId, { carteira: grupo.carteira + valorTotal });

    const texto = layout({
      comando: 'vender-minerio',
      titulo: '🌑 𝐕𝐄𝐍𝐃𝐀 🌑',
      linhas: [
        `🌑 ${minerio.emoji} ${minerio.exibicao}: ${qtd}`,
        `🌑 𝙑𝙖𝙡𝙤𝙧 𝙪𝙣𝙞.: ${formatReal(minerio.valor)}`,
        `🌑 𝙏𝙤𝙩𝙖𝙡: ${formatReal(valorTotal)}`,
        `🌑 𝙎𝙖𝙡𝙙𝙤: ${formatReal(grupo.carteira + valorTotal)}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
