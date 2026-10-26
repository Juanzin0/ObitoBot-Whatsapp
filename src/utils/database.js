const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');

const DB_PATH = path.join(__dirname, '..', 'database', 'users.json');
const GRUPOS_PATH = path.join(__dirname, '..', 'database', 'grupos.json');

// ===== CACHE EM MEMÓRIA =====
const CACHE_GRUPO_NOME = new Map();

function setNomeGrupo(groupId, nome) {
  if (groupId && nome) CACHE_GRUPO_NOME.set(groupId, nome);
}

function getNomeGrupo(groupId) {
  return CACHE_GRUPO_NOME.get(groupId) || null;
}

// ===== GRUPOS.JSON =====
function loadGrupos() {
  if (!fs.existsSync(GRUPOS_PATH)) {
    fs.mkdirSync(path.dirname(GRUPOS_PATH), { recursive: true });
    fs.writeFileSync(GRUPOS_PATH, '{}');
  }
  try {
    return JSON.parse(fs.readFileSync(GRUPOS_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveGrupos(db) {
  fs.writeFileSync(GRUPOS_PATH, JSON.stringify(db, null, 2));
}

function setNomeGrupoDB(groupId, nome) {
  if (!groupId || !nome) return;
  const db = loadGrupos();
  if (db[groupId] === nome) return;
  db[groupId] = nome;
  saveGrupos(db);
  setNomeGrupo(groupId, nome);
}

function getNomeGrupoDB(groupId) {
  const cache = CACHE_GRUPO_NOME.get(groupId);
  if (cache) return cache;
  const db = loadGrupos();
  const nome = db[groupId] || null;
  if (nome) CACHE_GRUPO_NOME.set(groupId, nome);
  return nome;
}

// ===== USERS.JSON =====
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, '{}');
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function semanaStr() {
  const d = new Date();
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const seg = new Date(d);
  seg.setDate(seg.getDate() + diff - 5);
  return `${seg.getFullYear()}-${seg.getMonth() + 1}-${seg.getDate()}`;
}

function gerarRG() {
  const p1 = String(Math.floor(Math.random() * 900) + 100);
  const p2 = String(Math.floor(Math.random() * 900) + 100);
  return `${p1}-${p2}`;
}

function ehDono(jid) {
  if (!jid) return false;
  const numero = jid.split('@')[0];
  const donoConfig = config.dono;
  if (numero === donoConfig) return true;
  if (numero === `55${donoConfig.slice(2, 4)}9${donoConfig.slice(4)}`) return true;
  if (numero === `55${donoConfig.slice(2, 4)}${donoConfig.slice(4)}`) return true;
  return false;
}

function getGrupoId(from, sender) {
  if (from && from.endsWith('@g.us')) return from;
  return `pv:${sender}`;
}

// ===== ESTRUTURA POR GRUPO =====
function grupoPadrao() {
  return {
    nomeGrupo: null,
    carteira: 0,
    banco: 0,
    moedas: { BTC: 0, EUR: 0, USD: 0, XAU: 0, XAG: 0, ETH: 0, SOL: 0, XRP: 0 },
    escudo: null,
    profissaoIndex: 0,
    progressoCarreira: 0,
    ultimoTrabalho: 0,
    trabalhosHoje: 0,
    dataTrabalho: todayStr(),
    extraUsos: 2,
    extraReset: 0,
    horaExtraTotal: 0,
    horaExtraSemana: semanaStr(),
    horaExtraBloqueadoAte: 0,
    roubosHoje: 0,
    dataRoubos: todayStr(),
    mineracoesHoje: 0,
    dataMineracao: todayStr(),
    dividaBanco: { valor: 0, dataEmprestimo: 0, prazo: 5, pago: true },
    emprestimos: [],
    recompensas: {
      diario: { ultimoUso: 0, diasConsecutivos: 0 },
      semanal: { ultimoUso: 0 },
      mensal: { ultimoUso: 0 },
    },
    streakMensagem: 0,
    ultimaMensagemDia: '',
    totalMensagens: 0,
    totalComandos: 0,
  };
}

function userPadrao(jid) {
  return {
    jid,
    aliases: [],
    rg: gerarRG(),
    rgSujo: false,
    rgSujoAte: 0,
    senha: null,
    nome: null,
    senhaTentativas: 0,
    senhaBloqueadoAte: 0,
    grupos: {},
  };
}

// ===== UNIFICAÇÃO + MERGE DE LID =====
function unificarJids(db, jids) {
  jids = [...new Set(jids.filter(Boolean))];
  if (jids.length === 0) return null;

  let principal = null;
  for (const jid of jids) {
    if (db[jid]) {
      principal = db[jid].jid || jid;
      break;
    }
  }

  if (!principal) {
    principal = jids[0];
    db[principal] = userPadrao(principal);
  }

  if (!db[principal]) db[principal] = userPadrao(principal);
  if (!db[principal].aliases) db[principal].aliases = [];
  if (!db[principal].grupos) db[principal].grupos = {};

  for (const jid of jids) {
    if (jid === principal) continue;

    if (db[jid] && db[jid] !== db[principal]) {
      const userAntigo = db[jid];
      if (!db[principal].senha && userAntigo.senha) {
        db[principal].senha = userAntigo.senha;
      }
      if (!db[principal].rg && userAntigo.rg) {
        db[principal].rg = userAntigo.rg;
      }
      if (!db[principal].nome && userAntigo.nome) {
        db[principal].nome = userAntigo.nome;
      }
      if (userAntigo.grupos) {
        for (const gid of Object.keys(userAntigo.grupos)) {
          if (!db[principal].grupos[gid]) {
            db[principal].grupos[gid] = userAntigo.grupos[gid];
          }
        }
      }
      if (userAntigo.aliases) {
        for (const a of userAntigo.aliases) {
          if (!db[principal].aliases.includes(a)) {
            db[principal].aliases.push(a);
          }
        }
      }
    }

    if (!db[principal].aliases.includes(jid)) {
      db[principal].aliases.push(jid);
    }
    db[jid] = db[principal];
  }

  return principal;
}

function getUser(jidOuJids) {
  const db = loadDB();
  const jids = Array.isArray(jidOuJids) ? jidOuJids : [jidOuJids];
  const principal = unificarJids(db, jids);
  if (!principal) return null;

  const padrao = userPadrao(principal);
  let mudou = false;
  for (const k of Object.keys(padrao)) {
    if (db[principal][k] === undefined) {
      db[principal][k] = padrao[k];
      mudou = true;
    }
  }

  if (mudou) {
    const aliases = db[principal].aliases || [];
    for (const a of aliases) db[a] = db[principal];
    saveDB(db);
  }
  return db[principal];
}

function getUserGrupo(jidOuJids, groupId) {
  const db = loadDB();
  const jids = Array.isArray(jidOuJids) ? jidOuJids : [jidOuJids];
  const principal = unificarJids(db, jids);
  if (!principal) return null;

  if (!db[principal].grupos) db[principal].grupos = {};
  if (!db[principal].grupos[groupId]) {
    db[principal].grupos[groupId] = grupoPadrao();
  }

  const padrao = grupoPadrao();
  let mudou = false;
  for (const k of Object.keys(padrao)) {
    if (db[principal].grupos[groupId][k] === undefined) {
      db[principal].grupos[groupId][k] = padrao[k];
      mudou = true;
    }
  }

  if (mudou) {
    const aliases = db[principal].aliases || [];
    for (const a of aliases) db[a] = db[principal];
    saveDB(db);
  }

  return {
    global: db[principal],
    grupo: db[principal].grupos[groupId],
    groupId,
    jid: principal,
  };
}

function updateUser(jidOuJids, patch) {
  const db = loadDB();
  const jids = Array.isArray(jidOuJids) ? jidOuJids : [jidOuJids];
  const principal = unificarJids(db, jids);
  if (!principal) return null;

  db[principal] = { ...db[principal], ...patch };

  const aliases = db[principal].aliases || [];
  for (const a of aliases) db[a] = db[principal];

  saveDB(db);
  return db[principal];
}

function updateUserGrupo(jidOuJids, groupId, patch) {
  const db = loadDB();
  const jids = Array.isArray(jidOuJids) ? jidOuJids : [jidOuJids];
  const principal = unificarJids(db, jids);
  if (!principal) return null;

  if (!db[principal].grupos) db[principal].grupos = {};
  if (!db[principal].grupos[groupId]) db[principal].grupos[groupId] = grupoPadrao();

  const grupoAtual = db[principal].grupos[groupId];
  const patchFinal = { ...patch };

  if (ehDono(principal)) {
    if (patchFinal.carteira !== undefined && patchFinal.carteira < grupoAtual.carteira) {
      patchFinal.carteira = grupoAtual.carteira;
    }
    if (patchFinal.banco !== undefined && patchFinal.banco < (grupoAtual.banco || 0)) {
      patchFinal.banco = grupoAtual.banco || 0;
    }
    if (patchFinal.escudo === null && grupoAtual.escudo) {
      patchFinal.escudo = grupoAtual.escudo;
    }
  }

  db[principal].grupos[groupId] = { ...grupoAtual, ...patchFinal };

  const aliases = db[principal].aliases || [];
  for (const a of aliases) db[a] = db[principal];

  saveDB(db);
  return db[principal].grupos[groupId];
}

function getAllUsers() {
  const db = loadDB();
  const vistos = new Set();
  const lista = [];
  for (const jid of Object.keys(db)) {
    if (vistos.has(jid)) continue;
    const u = db[jid];
    if (!u || !u.jid) continue;
    if (vistos.has(u.jid)) { vistos.add(jid); continue; }
    lista.push(u);
    vistos.add(jid);
    vistos.add(u.jid);
    if (u.aliases) for (const a of u.aliases) vistos.add(a);
  }
  return lista;
}

function resetarSeNovoDia(grupo, patchBase = {}) {
  const hoje = todayStr();
  const patch = { ...patchBase };
  if (grupo.dataTrabalho !== hoje) {
    patch.trabalhosHoje = 0;
    patch.dataTrabalho = hoje;
  }
  if (grupo.dataRoubos !== hoje) { patch.roubosHoje = 0; patch.dataRoubos = hoje; }
  if (grupo.dataMineracao !== hoje) { patch.mineracoesHoje = 0; patch.dataMineracao = hoje; }
  return patch;
}

// ===== RG SUJO =====
function rgSujo(jidOuJids) {
  const user = getUser(jidOuJids);
  if (!user) return false;
  if (!user.rgSujo) return false;
  // Se passou o tempo, limpa
  if (user.rgSujoAte && Date.now() > user.rgSujoAte) {
    updateUser(jidOuJids, { rgSujo: false, rgSujoAte: 0 });
    return false;
  }
  return true;
}

function sujarRG(jidOuJids, dias = 3) {
  updateUser(jidOuJids, {
    rgSujo: true,
    rgSujoAte: Date.now() + (dias * 24 * 60 * 60 * 1000),
  });
}

function limparRG(jidOuJids) {
  updateUser(jidOuJids, { rgSujo: false, rgSujoAte: 0 });
}

function gerarRelatorioRGs() {
  const db = loadDB();
  const vistos = new Set();
  const relatorio = {};
  for (const jid of Object.keys(db)) {
    if (vistos.has(jid)) continue;
    const u = db[jid];
    if (!u || !u.jid) continue;
    if (u.jid !== jid) { vistos.add(jid); continue; }
    const nome = u.nome || jid.split('@')[0];
    relatorio[jid] = { nome, rg: u.rg || 'sem-rg' };
    vistos.add(jid);
    if (u.aliases) for (const a of u.aliases) vistos.add(a);
  }
  return relatorio;
}

function salvarRelatorioRGs() {
  const relatorio = gerarRelatorioRGs();
  const caminho = path.join(__dirname, '..', 'database', 'users-rg.json');
  fs.writeFileSync(caminho, JSON.stringify(relatorio, null, 2));
  return caminho;
}

module.exports = {
  loadDB,
  saveDB,
  getUser,
  getUserGrupo,
  updateUser,
  updateUserGrupo,
  getAllUsers,
  todayStr,
  semanaStr,
  resetarSeNovoDia,
  gerarRG,
  ehDono,
  getGrupoId,
  setNomeGrupo,
  getNomeGrupo,
  setNomeGrupoDB,
  getNomeGrupoDB,
  rgSujo,
  sujarRG,
  limparRG,
  gerarRelatorioRGs,
  salvarRelatorioRGs,
};
