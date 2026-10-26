const { layout } = require('../../templates/layout');
const fs = require('fs');
const path = require('path');

function carregarComandos() {
  const comandos = [];
  const cmdPath = path.join(__dirname, '..', '..', 'commands');

  function procurar(dir) {
    if (!fs.existsSync(dir)) return;
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entradas) {
      const caminho = path.join(dir, e.name);
      if (e.isDirectory()) {
        procurar(caminho);
      } else if (e.name.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(caminho)];
          const cmd = require(caminho);
          if (cmd.name && typeof cmd.execute === 'function') {
            comandos.push({
              nome: cmd.name,
              categoria: cmd.categoria || 'geral',
              oculto: cmd.oculto === true,
            });
          }
        } catch (err) {}
      }
    }
  }

  procurar(cmdPath);
  return comandos;
}

module.exports = {
  name: 'ajuda',
  categoria: 'utilidades',

  async execute({ sock, msg, from }) {
    const comandos = carregarComandos().filter(c => !c.oculto);

    // Agrupa por categoria
    const cats = {};
    for (const c of comandos) {
      if (!cats[c.categoria]) cats[c.categoria] = [];
      cats[c.categoria].push(c.nome);
    }

    const linhas = [`🌑 𝙏𝙤𝙩𝙖𝙡: ${comandos.length} 𝙘𝙤𝙢𝙖𝙣𝙙𝙤𝙨`, '🌑'];

    for (const [cat, nomes] of Object.entries(cats).sort()) {
      linhas.push(`🌑 📁 ${cat.toUpperCase()}`);
      linhas.push(`🌑    ${nomes.map(n => '!' + n).join(', ')}`);
      linhas.push('🌑');
    }

    const texto = layout({
      comando: 'ajuda',
      titulo: '🌑 𝐀𝐉𝐔𝐃𝐀 🌑',
      linhas,
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
