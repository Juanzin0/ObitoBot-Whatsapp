const { ehDono } = require('../../utils/database');
const config = require('../../config/config.json');
const { layout } = require('../../templates/layout');
const path = require('path');
const fs = require('fs');

// ===== VERIFICA SE O COMANDO É STUB =====
function ehStub(arquivo) {
  try {
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    // Detecta o stub pelos marcadores
    return conteudo.includes('EM 𝐃𝐄𝐒𝐄𝐍𝐕𝐎𝐋𝐕𝐈𝐌𝐄𝐍𝐓𝐎') ||
           conteudo.includes('TODO: implementar') ||
           conteudo.includes('está em construção');
  } catch { return false; }
}

// ===== CARREGA TODOS OS COMANDOS =====
function carregarTodosComandos() {
  const comandos = [];
  const cmdPath = path.join(__dirname, '..', '..', 'commands');

  function procurar(dir) {
    if (!fs.existsSync(dir)) return;
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    for (const entrada of entradas) {
      const caminho = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        procurar(caminho);
      } else if (entrada.name.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(caminho)];
          const cmd = require(caminho);
          if (cmd.name && typeof cmd.execute === 'function') {
            comandos.push({
              cmd,
              arquivo: caminho,
              nome: cmd.name,
              categoria: cmd.categoria || 'geral',
              stub: ehStub(caminho),
            });
          }
        } catch (e) {
          // Ignora
        }
      }
    }
  }

  procurar(cmdPath);
  return comandos;
}

function buscarComando(nome) {
  const todos = carregarTodosComandos();
  return todos.find(c => c.nome === nome) || null;
}

// ===== ARGS DE TESTE POR COMANDO =====
function argsDeTeste(nome) {
  const map = {
    pix: ['1k'],
    emprestar: ['1k', '10'],
    emprestimo: ['1k'],
    depositar: ['1k'],
    sacar: ['500'],
    investir: ['100'],
    roubar: [],
    pagar: ['banco'],
    'comprar-btc': ['0.001'],
    'vender-btc': ['0.001'],
    'vender-minerio': ['carvao', '1'],
    criarsenha: ['1234'],
    bug: ['teste de bug'],
    simular: [],
    'comprar-escudo': ['escudo'],
  };
  return map[nome] || [];
}

module.exports = {
  name: 'simular',
  categoria: 'admin',
  oculto: true,

  async execute({ sock, msg, from, sender, args, mentioned }) {
    // ===== SÓ O DONO =====
    if (!ehDono(sender)) return;

    // ===== MODO: !simular todos =====
    if (args[0] && args[0].toLowerCase() === 'todos') {
      return executarTodos({ sock, msg, from, sender });
    }

    // ===== MODO: !simular listar =====
    if (args[0] && args[0].toLowerCase() === 'listar') {
      return listarComandos({ sock, msg, from });
    }

    // ===== MODO NORMAL =====
    if (!mentioned || mentioned.length === 0) {
      return sock.sendMessage(from, {
        text: '🌑 Uso:\n🌑 !simular @user roubar\n🌑 !simular todos\n🌑 !simular listar',
      });
    }

    const alvo = mentioned[0];

    const comandoTexto = args
      .filter(a => !a.startsWith('@'))
      .join(' ');

    if (!comandoTexto) {
      return sock.sendMessage(from, {
        text: '🌑 Use: !simular @user roubar',
      });
    }

    const cmdFinal = comandoTexto.startsWith('!') ? comandoTexto : `!${comandoTexto}`;

    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const todasMencoes = ctx?.mentionedJid || [];
    const mencoesDoComando = todasMencoes.slice(1);

    const PREFIX = '!';
    const semPrefixo = cmdFinal.slice(PREFIX.length).trim();
    const partes = semPrefixo.split(/\s+/);
    const nomeCmd = partes[0].toLowerCase();
    const argsComando = partes.slice(1);

    if (mencoesDoComando.length === 0 && ['roubar', 'pix', 'emprestar'].includes(nomeCmd)) {
      mencoesDoComando.push(`${config.dono}@s.whatsapp.net`);
    }

    const encontrado = buscarComando(nomeCmd);
    if (!encontrado) {
      return sock.sendMessage(from, {
        text: `🌑 Comando "${nomeCmd}" não encontrado.`,
      });
    }

    const msgFalsa = {
      ...msg,
      key: { ...msg.key, participant: alvo },
    };

    try {
      await encontrado.cmd.execute({
        sock,
        msg: msgFalsa,
        from,
        sender: alvo,
        args: argsComando,
        mentioned: mencoesDoComando,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `🌑 Erro: ${e.message}`,
      });
    }
  }
};

// ============================================================
//  MODO: !simular listar
// ============================================================
async function listarComandos({ sock, msg, from }) {
  const comandos = carregarTodosComandos();

  const funcionais = comandos.filter(c => !c.stub);
  const stubs = comandos.filter(c => c.stub);

  const linhas = [
    `🌑 📊 𝙏𝙊𝙏𝘼𝙇: ${comandos.length}`,
    `🌑 ✅ 𝙁𝙐𝙉𝘾𝙄𝙊𝙉𝘼𝙄𝙎: ${funcionais.length}`,
    `🌑 🚧 𝙀𝙈 𝘿𝙀𝙎𝙀𝙉𝙑𝙊𝙇𝙑𝙄𝙈𝙀𝙉𝙏𝙊: ${stubs.length}`,
    '🌑',
    '🌑 ✅ 𝙁𝙐𝙉𝘾𝙄𝙊𝙉𝘼𝙄𝙎:',
  ];

  // Agrupa funcionais por categoria
  const funcPorCat = {};
  for (const c of funcionais) {
    if (!funcPorCat[c.categoria]) funcPorCat[c.categoria] = [];
    funcPorCat[c.categoria].push(c.nome);
  }

  for (const [cat, nomes] of Object.entries(funcPorCat)) {
    linhas.push(`🌑   📁 ${cat}:`);
    linhas.push(`🌑     ${nomes.join(', ')}`);
  }

  linhas.push('🌑');
  linhas.push('🌑 🚧 𝙀𝙈 𝘿𝙀𝙎𝙀𝙉𝙑𝙊𝙇𝙑𝙄𝙈𝙀𝙉𝙏𝙊:');

  const stubPorCat = {};
  for (const c of stubs) {
    if (!stubPorCat[c.categoria]) stubPorCat[c.categoria] = [];
    stubPorCat[c.categoria].push(c.nome);
  }

  for (const [cat, nomes] of Object.entries(stubPorCat)) {
    linhas.push(`🌑   📁 ${cat}:`);
    linhas.push(`🌑     ${nomes.join(', ')}`);
  }

  const texto = layout({
    comando: 'simular',
    titulo: '🌑 𝐋𝐈𝐒𝐓𝐀 🌑',
    linhas,
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}

// ============================================================
//  MODO: !simular todos
// ============================================================
async function executarTodos({ sock, msg, from, sender }) {
  const comandos = carregarTodosComandos();
  const total = comandos.length;

  await sock.sendMessage(from, {
    text: `🌑 Iniciando teste de ${total} comandos...\n🌑 Intervalo: 500ms\n🌑 Aguarde...`,
  }, { quoted: msg });

  const resultados = [];
  let passou = 0;
  let falhou = 0;
  let pulou = 0;

  const IGNORAR = ['simular', 'menu', 'economia', 'ajuda', 'info', 'ping', 'testarcmd'];
  const COMANDOS_COM_MENCAO = ['pix', 'emprestar', 'roubar', 'pagar'];

  for (let i = 0; i < comandos.length; i++) {
    const { cmd, nome, categoria, stub } = comandos[i];

    if (IGNORAR.includes(nome)) {
      resultados.push({ nome, categoria, status: '⏭️', erro: 'ignorado' });
      pulou++;
      continue;
    }

    const donoJid = `${config.dono}@s.whatsapp.net`;
    const mencoes = COMANDOS_COM_MENCAO.includes(nome) ? [donoJid] : [];
    const args = argsDeTeste(nome);

    const msgFalsa = {
      ...msg,
      key: { ...msg.key, participant: donoJid },
    };

    try {
      let respondeu = false;

      const sockOriginal = {
        ...sock,
        sendMessage: async (...a) => {
          respondeu = true;
          return sock.sendMessage(...a);
        },
      };

      await cmd.execute({
        sock: sockOriginal,
        msg: msgFalsa,
        from,
        sender: donoJid,
        args,
        mentioned: mencoes,
      });

      if (respondeu) {
        // Se for stub, marca como 🚧
        if (stub) {
          resultados.push({ nome, categoria, status: '🚧', erro: null });
          passou++; // conta como "respondeu" mas o status é 🚧
        } else {
          resultados.push({ nome, categoria, status: '✅', erro: null });
          passou++;
        }
      } else {
        resultados.push({ nome, categoria, status: '⚠️', erro: 'não respondeu' });
        falhou++;
      }
    } catch (e) {
      resultados.push({ nome, categoria, status: '❌', erro: e.message });
      falhou++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  await enviarRelatorio({ sock, from, msg, resultados, total, passou, falhou, pulou });
}

async function enviarRelatorio({ sock, from, msg, resultados, total, passou, falhou, pulou }) {
  const funcionais = resultados.filter(r => r.status === '✅');
  const stubs = resultados.filter(r => r.status === '🚧');
  const falhas = resultados.filter(r => r.status === '❌' || r.status === '⚠️');
  const taxa = total > 0 ? Math.round(((passou + stubs.length) / (total - pulou)) * 100) : 0;

  const linhas = [
    `🌑 𝙏𝙊𝙏𝘼𝙇: ${total}`,
    `🌑 ✅ 𝙁𝙐𝙉𝘾𝙄𝙊𝙉𝘼𝙄𝙎: ${funcionais.length}`,
    `🌑 🚧 𝙀𝙈 𝘿𝙀𝙎𝙀𝙉𝙑𝙊𝙇𝙑𝙄𝙈𝙀𝙉𝙏𝙊: ${stubs.length}`,
    `🌑 ❌ 𝙁𝘼𝙇𝙃𝘼𝙍𝘼𝙈: ${falhas.length}`,
    `🌑 ⏭️ 𝙄𝙂𝙉𝙊𝙍𝘼𝘿𝙊𝙎: ${pulou}`,
    `🌑 📊 𝙏𝘼𝙓𝘼 𝘿𝙀 𝙀𝙓𝙀𝘾𝙐𝙄̧𝘼̃𝙊: ${taxa}%`,
    '🌑',
  ];

  // ===== FUNCIONAIS =====
  if (funcionais.length > 0) {
    linhas.push('🌑 ✅ 𝙁𝙐𝙉𝘾𝙄𝙊𝙉𝘼𝙄𝙎:');
    const nomes = funcionais.map(f => `!${f.nome}`).join(', ');
    linhas.push(`🌑 ${nomes}`);
    linhas.push('🌑');
  }

  // ===== EM DESENVOLVIMENTO =====
  if (stubs.length > 0) {
    linhas.push('🌑 🚧 𝙀𝙈 𝘿𝙀𝙎𝙀𝙉𝙑𝙊𝙇𝙑𝙄𝙈𝙀𝙉𝙏𝙊:');
    for (const s of stubs) {
      linhas.push(`🌑   !${s.nome} (${s.categoria})`);
    }
    linhas.push('🌑');
  }

  // ===== FALHAS =====
  if (falhas.length > 0) {
    linhas.push('🌑 ❌ 𝙁𝘼𝙇𝙃𝘼𝙎:');
    for (const f of falhas) {
      linhas.push(`🌑   ${f.status} !${f.nome} (${f.categoria})`);
      if (f.erro && f.erro !== 'não respondeu' && f.erro !== 'ignorado') {
        const erroCurto = f.erro.length > 45 ? f.erro.substring(0, 42) + '...' : f.erro;
        linhas.push(`🌑      ↳ ${erroCurto}`);
      }
    }
  } else {
    linhas.push('🌑 🎉 Nenhuma falha!');
  }

  const texto = layout({
    comando: 'simular',
    titulo: '🌑 𝐑𝐄𝐋𝐀𝐓𝐎́𝐑𝐈𝐎 🌑',
    linhas,
  });

  await sock.sendMessage(from, { text: texto }, { quoted: msg });
}
