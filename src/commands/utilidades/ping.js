/**
 * COMANDO: ping
 * CATEGORIA: utilidades
 * DESCRIÇÃO: (a preencher)
 */

const { layout } = require('../../templates/layout');
const { getUser, updateUser } = require('../../utils/database');
const { formatReal, parseMoeda } = require('../../utils/moeda');

module.exports = {
  name: 'ping',
  categoria: 'utilidades',

  async execute({ sock, msg, from, sender, args, mentioned }) {
    // TODO: implementar lógica do comando
    const texto = layout({
      comando: 'ping',
      titulo: '🌑 𝐄𝐌 𝐃𝐄𝐒𝐄𝐍𝐕𝐎𝐋𝐕𝐈𝐌𝐄𝐍𝐓𝐎 🌑',
      linhas: ['🌑 Este comando está em construção...'],
    });
    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
