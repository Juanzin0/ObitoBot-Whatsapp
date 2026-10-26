// ===== ANTI-CRASH (impede o bot de morrer por erros do Baileys) =====
process.on('uncaughtException', (err) => {
  console.error('🌑 Erro não tratado:', err?.message || err);
});
process.on('unhandledRejection', (err) => {
  console.error('🌑 Promise rejeitada:', err?.message || err);
});

// ===== SILENCIA LOGS DO LIBSIGNAL =====
const _origError = console.error;
const _origLog = console.log;
console.error = (...args) => {
  const msg = String(args[0] || '');
  if (
    msg.includes('Bad MAC') ||
    msg.includes('Failed to decrypt') ||
    msg.includes('Session error') ||
    msg.includes('Closing session') ||
    msg.includes('Closing open session') ||
    msg.includes('Decrypted message with closed session') ||
    msg.includes('in favor of incoming prekey bundle') ||
    msg.includes('SessionEntry')
  ) return;
  _origError(...args);
};
console.log = (...args) => {
  const msg = String(args[0] || '');
  if (
    msg.includes('Closing session') ||
    msg.includes('Closing open session') ||
    msg.includes('in favor of incoming prekey bundle') ||
    msg.includes('SessionEntry')
  ) return;
  _origLog(...args);
};

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { acharComandoSimilar } = require('./src/utils/similaridade');
const { layout } = require('./src/templates/layout');
const { getSaudacao, getTituloStreak, getMsgDia } = require('./src/utils/mensagensDiarias');
const { registrarLid, resolverLid, ehLid } = require('./src/utils/lidmap');
const {
  getUser,
  updateUser,
  loadDB,
  saveDB,
  salvarRelatorioRGs,
  setNomeGrupoDB,
  getUserGrupo,
  updateUserGrupo,
} = require('./src/utils/database');

const PREFIX = '!';

// ===== READLINE PRA PEDIR O NÚMERO =====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// ===== CARREGA COMANDOS =====
const commands = new Map();

function carregarComandos(dir) {
  if (!fs.existsSync(dir)) return;
  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) carregarComandos(caminho);
    else if (entrada.name.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(caminho)];
        const cmd = require(caminho);
        if (cmd.name && typeof cmd.execute === 'function') {
          commands.set(cmd.name, cmd);
        }
      } catch (e) {
        console.error(`🌑 Erro ao carregar ${caminho}:`, e.message);
      }
    }
  }
}

carregarComandos(path.join(__dirname, 'src', 'commands'));
console.log(`🌑 ${commands.size} comandos carregados.`);

// ===== NORMALIZA NÚMERO BR =====
function variacoesJidBr(jid) {
  if (!jid || !jid.endsWith('@s.whatsapp.net')) return [];
  const [numero] = jid.split('@');
  if (!numero.startsWith('55')) return [];

  const variacoes = [];

  if (numero.length === 13) {
    const ddd = numero.slice(2, 4);
    const resto = numero.slice(4);
    if (resto.startsWith('9')) {
      variacoes.push(`55${ddd}${resto.slice(1)}@s.whatsapp.net`);
    }
  }

  if (numero.length === 12) {
    const ddd = numero.slice(2, 4);
    const resto = numero.slice(4);
    variacoes.push(`55${ddd}9${resto}@s.whatsapp.net`);
  }

  if (numero.length === 14) {
    const ddd = numero.slice(2, 4);
    const resto = numero.slice(4);
    if (resto.startsWith('99')) {
      variacoes.push(`55${ddd}9${resto.slice(2)}@s.whatsapp.net`);
      variacoes.push(`55${ddd}${resto.slice(1)}@s.whatsapp.net`);
    }
  }

  return [...new Set(variacoes)];
}

function resolverSenderUnificado(msg) {
  const key = msg.key;
  const baseJids = [
    key.participantPn,
    key.participant,
    key.remoteJid,
  ].filter(Boolean);

  const candidatos = [];
  for (const jid of baseJids) {
    candidatos.push(jid);
    candidatos.push(...variacoesJidBr(jid));
    // Se for @lid, resolve pro @s.whatsapp.net
    if (ehLid(jid)) {
      const pn = resolverLid(jid);
      if (pn) candidatos.push(pn);
    }
  }

  const user = getUser([...new Set(candidatos)]);
  return user ? user.jid : candidatos[0];
}

function resolverMencoes(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (!ctx) return [];

  const mentionedJids = [
    ...(ctx.mentionedJidPn || []),
    ...(ctx.mentionedJid || []),
  ].filter(Boolean);

  const resolvidos = [];
  for (const jid of mentionedJids) {
    const variacoes = [jid, ...variacoesJidBr(jid)];
    // Se for @lid, resolve pro @s.whatsapp.net
    if (ehLid(jid)) {
      const pn = resolverLid(jid);
      if (pn) variacoes.push(pn);
    }
    const user = getUser(variacoes);
    if (user) resolvidos.push(user.jid);
    else resolvidos.push(jid);
  }

  return [...new Set(resolvidos)];
}

// ===== ESTADO DO BOT (cooldowns offline) =====
const BOT_STATE_PATH = path.join(__dirname, 'src', 'database', 'botState.json');

function loadBotState() {
  try {
    if (!fs.existsSync(BOT_STATE_PATH)) return {};
    return JSON.parse(fs.readFileSync(BOT_STATE_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveBotState(state) {
  fs.writeFileSync(BOT_STATE_PATH, JSON.stringify(state, null, 2));
}

// ===== AJUSTA COOLDOWNS SE O BOT FICOU OFFLINE =====
function ajustarCooldowns() {
  const state = loadBotState();
  const agora = Date.now();

  if (state.ultimaVezOnline) {
    const offline = agora - state.ultimaVezOnline;
    const umMinuto = 60 * 1000;

    if (offline > umMinuto) {
      console.log(`🌑 Bot ficou offline por ${Math.floor(offline / 60000)}min. Ajustando cooldowns...`);

      const db = loadDB();
      let ajustados = 0;

      for (const jid of Object.keys(db)) {
        const u = db[jid];
        if (!u) continue;

        if (u.grupos) {
          for (const gid of Object.keys(u.grupos)) {
            const g = u.grupos[gid];
            if (!g) continue;
            if (g.ultimoTrabalho > 0) {
              g.ultimoTrabalho += offline;
              ajustados++;
            }
            if (g.extraReset > 0) {
              g.extraReset += offline;
            }
            if (g.horaExtraBloqueadoAte > 0) {
              g.horaExtraBloqueadoAte += offline;
            }
            if (g.recompensas) {
              if (g.recompensas.diario?.ultimoUso > 0) g.recompensas.diario.ultimoUso += offline;
              if (g.recompensas.semanal?.ultimoUso > 0) g.recompensas.semanal.ultimoUso += offline;
              if (g.recompensas.mensal?.ultimoUso > 0) g.recompensas.mensal.ultimoUso += offline;
            }
          }
        }

        if (u.senhaBloqueadoAte > 0) {
          u.senhaBloqueadoAte += offline;
        }
      }

      saveDB(db);
      console.log(`🌑 ${ajustados} cooldowns ajustados.`);
    }
  }

  saveBotState({ ultimaVezOnline: agora });
}

// ===== RECOMPENSA POR PRIMEIRA MENSAGEM DO DIA =====
const VALOR_DIARIO = 500;
const BONUS_STREAK = 2000;
const DIAS_BONUS = 7;

function hojeStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ontemStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function checarRecompensaDiaria(sock, msg, sender, from) {
  if (!from.endsWith('@g.us')) return false;

  const groupId = from;
  const { global, grupo } = getUserGrupo(sender, groupId);
  if (!global || !grupo) return false;

  const hoje = hojeStr();
  if (grupo.ultimaMensagemDia === hoje) return false;

  let novoStreak = 1;
  if (grupo.ultimaMensagemDia === ontemStr()) {
    novoStreak = (grupo.streakMensagem || 0) + 1;
  }

  let ganho = VALOR_DIARIO;
  let ehBonus = false;
  if (novoStreak >= DIAS_BONUS) {
    ganho += BONUS_STREAK;
    ehBonus = true;
  }

  const novaCarteira = (grupo.carteira || 0) + ganho;

  updateUserGrupo(sender, groupId, {
    carteira: novaCarteira,
    streakMensagem: novoStreak,
    ultimaMensagemDia: hoje,
  });

  const nome = global.nome || sender.split('@')[0];
  const saudacao = getSaudacao(`@${nome}`);
  const titulo = getTituloStreak(novoStreak);
  const msgEspecial = getMsgDia(novoStreak);

  const linhas = [
    `🌑 ${saudacao}`,
    '',
    '🌑 Você acaba de fazer sua primeira',
    '🌑 mensagem do dia e o ObitoBot',
    '🌑 te recompensa com:',
    '',
    `🌑 💰 + ${VALOR_DIARIO} COINS`,
  ];

  if (ehBonus) {
    linhas.push(`🌑 💎 + ${BONUS_STREAK} BÔNUS DE STREAK`);
  }

  linhas.push('');

  if (msgEspecial) {
    linhas.push(`🌑 ${msgEspecial}`);
    linhas.push('');
  } else {
    linhas.push('🌑 Mantenha o ritmo! Se aparecer');
    linhas.push('🌑 7 dias seguidos, leva bônus de');
    linhas.push(`🌑 💰 + ${BONUS_STREAK} COINS`);
    linhas.push('');
  }

  const emojiStreak = novoStreak >= 7 ? '💎' : novoStreak >= 3 ? '🔥' : '🌱';
  linhas.push(`🌑 𝙎𝙏𝙍𝙀𝘼𝙆: ${novoStreak}/7 ${emojiStreak}`);
  linhas.push(`🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: R$ ${novaCarteira.toLocaleString('pt-BR')}`);

  const texto = `╔🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑╗
┊🌑 ${titulo}
╚🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑╝

${linhas.join('\n')}`;

  try {
    await sock.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
  } catch (e) {
    console.error('🌑 Erro ao enviar recompensa diária:', e.message);
  }

  return true;
}

// ===== SALVA ESTADO QUANDO O BOT DESLIGA =====
function salvarEstadoSaida() {
  try {
    saveBotState({ ultimaVezOnline: Date.now() });
    salvarRelatorioRGs();
    console.log('🌑 Estado do bot e relatório de RGs salvos.');
  } catch (e) {
    console.log('🌑 Erro ao salvar estado:', e.message);
  }
}

process.on('SIGINT', () => { salvarEstadoSaida(); process.exit(0); });
process.on('SIGTERM', () => { salvarEstadoSaida(); process.exit(0); });
process.on('exit', salvarEstadoSaida);

// ===== USA PAIRING CODE =====
const USAR_PAIRING = false;

// ===== RECONEXÃO COM BACKOFF =====
let tentativasReconexao = 0;
const MAX_TENTATIVAS = 10;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Desktop'),
  });

  sock.ev.on('creds.update', saveCreds);

  let pairingSolicitado = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (
      connection === 'connecting' &&
      USAR_PAIRING &&
      !sock.authState.creds.registered &&
      !pairingSolicitado
    ) {
      pairingSolicitado = true;

      console.log('\n════════════════════════════════════════');
      console.log('   🌑 CONECTAR VIA CÓDIGO DE PAREAMENTO');
      console.log('════════════════════════════════════════');
      console.log('   Digite teu número com DDD + código do país');
      console.log('   Só dígitos. Ex: 558296293633');
      console.log('════════════════════════════════════════\n');

      try {
        const numero = await question('> ');
        const numeroLimpo = numero.replace(/\D/g, '');

        if (numeroLimpo.length < 10) {
          console.log('🌑 Número inválido. Usando QR...');
          if (qr) qrcode.generate(qr, { small: true });
          return;
        }

        const code = await sock.requestPairingCode(numeroLimpo);
        const formatado = code.match(/.{1,4}/g)?.join('-') || code;

        console.log('\n════════════════════════════════════════');
        console.log(`   🌑 CÓDIGO: ${formatado}`);
        console.log('════════════════════════════════════════');
        console.log('   1. Abre o WhatsApp no celular');
        console.log('   2. Vai em Dispositivos Conectados');
        console.log('   3. Conectar dispositivo');
        console.log('   4. Conectar com número de telefone');
        console.log('   5. Digita o código acima');
        console.log('════════════════════════════════════════\n');
      } catch (e) {
        console.error('🌑 Erro no pairing code:', e.message);
        console.log('🌑 Usando QR como fallback...\n');
        if (qr) qrcode.generate(qr, { small: true });
      }
    }
    else if (qr && !USAR_PAIRING) {
      console.log('🌑 Escaneie o QR abaixo:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const logado = statusCode === DisconnectReason.loggedOut;

      console.log('🌑 Conexão caiu. Código:', statusCode);

      if (logado) {
        console.log('🌑 Sessão encerrada (loggedOut). Delete a pasta "auth" e escaneie o QR novamente.');
        return;
      }

      tentativasReconexao++;
      if (tentativasReconexao > MAX_TENTATIVAS) {
        console.log('🌑 Muitas tentativas de reconexão. Parando por 5 minutos...');
        setTimeout(() => {
          tentativasReconexao = 0;
          startBot();
        }, 5 * 60 * 1000);
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, tentativasReconexao - 1), 30000);
      console.log(`🌑 Reconectando em ${Math.round(delay / 1000)}s (tentativa ${tentativasReconexao}/${MAX_TENTATIVAS})...`);
      setTimeout(() => startBot(), delay);

    } else if (connection === 'open') {
      console.log('🌑 ObitoBot conectado!');
      tentativasReconexao = 0;
      ajustarCooldowns();
    }
  });

  setInterval(() => {
    saveBotState({ ultimaVezOnline: Date.now() });
  }, 30 * 1000);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    if (!from) return;

    // ===== REGISTRA LID -> PN AUTOMATICAMENTE =====
    if (msg.key.participant && msg.key.participantPn) {
      registrarLid(msg.key.participant, msg.key.participantPn);
    }

    // ===== RESOLVE LID NO PV =====
    let remoteJidFinal = from;
    if (ehLid(from)) {
      const pn = resolverLid(from);
      if (pn) remoteJidFinal = pn;
    }

    const sender = resolverSenderUnificado(msg);

    // ===== CAPTURA RESPOSTAS DE EMPRÉSTIMO (grupo e PV) =====
    try {
      const cmdEmprestar = commands.get('emprestar');
      if (cmdEmprestar && typeof cmdEmprestar.tentarCapturarResposta === 'function') {
        const capturou = await cmdEmprestar.tentarCapturarResposta({ sock, msg, from, sender });
        if (capturou) return;
      }
    } catch (e) {
      console.error('🌑 Erro ao capturar resposta de emprestar:', e.message);
    }

    // ===== CAPTURA RESPOSTAS DE PAGAR (só PV) =====
    if (!from.endsWith('@g.us')) {
      try {
        const cmdPagar = commands.get('pagar');
        if (cmdPagar && typeof cmdPagar.tentarCapturarResposta === 'function') {
          const capturou = await cmdPagar.tentarCapturarResposta({ sock, msg, from, sender });
          if (capturou) return;
        }
      } catch (e) {
        console.error('🌑 Erro ao capturar resposta de pagar:', e.message);
      }
    }

    // ===== CAPTURA SENHA NO PV =====
    if (!from.endsWith('@g.us')) {
      try {
        const cmdCarteira = commands.get('carteira');
        if (cmdCarteira && typeof cmdCarteira.tentarCapturarSenha === 'function') {
          const capturou = await cmdCarteira.tentarCapturarSenha({ sock, msg, from, sender });
          if (capturou) return;
        }
      } catch (e) {
        console.error('🌑 Erro ao capturar senha:', e.message);
      }
    }

    // ===== SALVA NOME DO GRUPO NO CACHE + NO USER =====
    if (from.endsWith('@g.us')) {
      try {
        const meta = await sock.groupMetadata(from);
        if (meta && meta.subject) {
          setNomeGrupoDB(from, meta.subject);
          updateUserGrupo(sender, from, { nomeGrupo: meta.subject });
        }
      } catch {}
    }

    if (msg.pushName) {
      const u = getUser(sender);
      if (u && u.nome !== msg.pushName) {
        updateUser(sender, { nome: msg.pushName });
      }
    }

    // ===== INCREMENTA CONTADOR DE MENSAGENS (por grupo) =====
    const groupId = remoteJidFinal.endsWith('@g.us') ? remoteJidFinal : `pv:${sender}`;
    const dadosGrupo = getUserGrupo(sender, groupId);
    if (dadosGrupo && dadosGrupo.grupo) {
      updateUserGrupo(sender, groupId, {
        totalMensagens: (dadosGrupo.grupo.totalMensagens || 0) + 1,
      });
    }

    // ===== RECOMPENSA POR PRIMEIRA MENSAGEM DO DIA =====
    try {
      await checarRecompensaDiaria(sock, msg, sender, from);
    } catch (e) {
      console.error('🌑 Erro na recompensa diária:', e.message);
    }

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      '';

    if (!texto.startsWith(PREFIX)) return;

    const semPrefixo = texto.slice(PREFIX.length).trim();
    const partes = semPrefixo.split(/\s+/);
    const nomeCmd = partes[0].toLowerCase();
    const args = partes.slice(1);

    const cmd = commands.get(nomeCmd);

    // ===== COMANDO NÃO ENCONTRADO → SUGERE PARECIDO =====
    if (!cmd) {
      const listaNomes = [...commands.keys()];
      const sugestao = acharComandoSimilar(nomeCmd, listaNomes, 0.5);

      let texto;

      if (sugestao) {
        texto = layout({
          comando: 'erro',
          titulo: '🌑 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐈𝐍𝐕𝐀́𝐋𝐈𝐃𝐎 🌑',
          semFrase: true,
          linhas: [
            `🌑 𝘾𝙤𝙢𝙖𝙣𝙙𝙤: "${nomeCmd}"`,
            `🌑 𝙉𝙖̃𝙤 𝙚𝙭𝙞𝙨𝙩𝙚 𝙚𝙨𝙨𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤.`,
            '🌑 ─────────────',
            '🌑 𝙑𝙤𝙘𝙚̂ 𝙦𝙪𝙞𝙨 𝙙𝙞𝙯𝙚𝙧:',
            `🌑 💡 !${sugestao.nome}`,
          ],
        });
      } else {
        texto = layout({
          comando: 'erro',
          titulo: '🌑 𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐈𝐍𝐕𝐀́𝐋𝐈𝐃𝐎 🌑',
          semFrase: true,
          linhas: [
            `🌑 𝘾𝙤𝙢𝙖𝙣𝙙𝙤: "${nomeCmd}"`,
            `🌑 𝙉𝙖̃𝙤 𝙚𝙭𝙞𝙨𝙩𝙚 𝙚𝙨𝙨𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤.`,
            '🌑 ─────────────',
            '🌑 Use !ajuda para ver os comandos.',
          ],
        });
      }

      try {
        await sock.sendMessage(from, { text: texto }, { quoted: msg });
      } catch (e) {
        console.error('🌑 Erro ao enviar sugestão:', e.message);
      }
      return;
    }

    const mentioned = resolverMencoes(msg);

    // ===== INCREMENTA CONTADOR DE COMANDOS (por grupo) =====
    const dadosGrupo2 = getUserGrupo(sender, groupId);
    if (dadosGrupo2 && dadosGrupo2.grupo) {
      updateUserGrupo(sender, groupId, {
        totalComandos: (dadosGrupo2.grupo.totalComandos || 0) + 1,
      });
    }

    try {
      await cmd.execute({ sock, msg, from, sender, args, mentioned });
    } catch (err) {
      console.error('🌑 Erro no comando', nomeCmd, err);
      try {
        await sock.sendMessage(from, { text: '🌑 Deu erro aqui, mano.' }, { quoted: msg });
      } catch {}
    }
  });
}

startBot();
