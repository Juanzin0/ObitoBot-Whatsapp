const { layout } = require('../../templates/layout');
const { ehDono } = require('../../utils/database');
const fs = require('fs');
const path = require('path');

const IGNORAR = ['testarcmd', 'simular', 'godmode'];

module.exports = {
  name: 'testarcmd',
  categoria: 'admin',
  oculto: true,

  async execute({ sock, msg, from, sender }) {
    if (!ehDono(sender)) return;

    const cmdPath = path.join(__dirname, '..', '..', 'commands');
    const resultados = [];

    function procurar(dir) {
      if (!fs.existsSync(dir)) return;
      const entradas = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entradas) {
        const caminho = path.join(dir, e.name);
        if (e.isDirectory()) procurar(caminho);
        else if (e.name.endsWith('.js')) {
          const nomeArq = e.name.replace('.js', '');
          if (IGNORAR.includes(nomeArq)) continue;

          try {
            delete require.cache[require.resolve(caminho)];
            const cmd = require(caminho);
            if (cmd.name && typeof cmd.execute === 'function') {
              resultados.push({ arquivo: e.name, nome: cmd.name, status: '✅' });
            } else {
              resultados.push({ arquivo: e.name, nome: nomeArq, status: '⚠️', erro: 'sem name/execute' });
            }
          } catch (err) {
            resultados.push({ arquivo: e.name, nome: nomeArq, status: '❌', erro: err.message });
          }
        }
      }
    }

    procurar(cmdPath);

    const ok = resultados.filter(r => r.status === '✅').length;
    const erro = resultados.length - ok;

    const linhas = [
      `🌑 𝙏𝙤𝙩𝙖𝙡: ${resultados.length}`,
      `🌑 ✅ 𝙊𝙆: ${ok}`,
      `🌑 ❌ 𝙀𝙧𝙧𝙤: ${erro}`,
      '🌑',
    ];

    const falhas = resultados.filter(r => r.status !== '✅');
    if (falhas.length > 0) {
      linhas.push('🌑 𝙁𝘼𝙇𝙃𝘼𝙎:');
      for (const f of falhas) {
        const e = f.erro ? f.erro.substring(0, 40) : '';
        linhas.push(`🌑 ${f.status} ${f.nome}${e ? ' — ' + e : ''}`);
      }
    } else {
      linhas.push('🌑 🎉 Todos OK!');
    }

    const texto = layout({
      comando: 'testarcmd',
      titulo: '🌑 𝐓𝐄𝐒𝐓𝐄 🌑',
      linhas,
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
