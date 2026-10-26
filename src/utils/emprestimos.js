const fs = require('fs');
const path = require('path');

const PENDENTES_PATH = path.join(__dirname, '..', 'database', 'emprestimos-pendentes.json');
const EMPRESTIMOS_PATH = path.join(__dirname, '..', 'database', 'emprestimos.json');

const TEMPO_EXPIRA = 10 * 60 * 1000; // 10 min

// ═══════════════════════════════════════════════════════════
// PENDENTES (estado de conversa no PV)
// ═══════════════════════════════════════════════════════════
function loadPendentes() {
  if (!fs.existsSync(PENDENTES_PATH)) {
    fs.mkdirSync(path.dirname(PENDENTES_PATH), { recursive: true });
    fs.writeFileSync(PENDENTES_PATH, '{}');
  }
  try {
    return JSON.parse(fs.readFileSync(PENDENTES_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function savePendentes(db) {
  fs.writeFileSync(PENDENTES_PATH, JSON.stringify(db, null, 2));
}

function setPendente(jid, dados) {
  const db = loadPendentes();
  db[jid] = { ...dados, timestamp: Date.now() };
  savePendentes(db);
}

function getPendente(jid) {
  const db = loadPendentes();
  const p = db[jid];
  if (!p) return null;
  if (Date.now() - p.timestamp > TEMPO_EXPIRA) {
    delete db[jid];
    savePendentes(db);
    return null;
  }
  return p;
}

function limparPendente(jid) {
  const db = loadPendentes();
  delete db[jid];
  savePendentes(db);
}

// ═══════════════════════════════════════════════════════════
// EMPRÉSTIMOS ATIVOS
// ═══════════════════════════════════════════════════════════
function loadEmprestimos() {
  if (!fs.existsSync(EMPRESTIMOS_PATH)) {
    fs.mkdirSync(path.dirname(EMPRESTIMOS_PATH), { recursive: true });
    fs.writeFileSync(EMPRESTIMOS_PATH, '{}');
  }
  try {
    return JSON.parse(fs.readFileSync(EMPRESTIMOS_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveEmprestimos(db) {
  fs.writeFileSync(EMPRESTIMOS_PATH, JSON.stringify(db, null, 2));
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// Adiciona empréstimo ao devedor (global)
function adicionarEmprestimo(devedor, emp) {
  const db = loadEmprestimos();
  if (!db[devedor]) db[devedor] = [];
  db[devedor].push(emp);
  saveEmprestimos(db);
}

// Lista empréstimos ativos de um devedor
function listarEmprestimos(devedor) {
  const db = loadEmprestimos();
  return db[devedor] || [];
}

// Marca empréstimo como pago
function marcarPago(devedor, id) {
  const db = loadEmprestimos();
  if (!db[devedor]) return false;
  const emp = db[devedor].find(e => e.id === id);
  if (!emp) return false;
  emp.pago = true;
  emp.dataPagamento = Date.now();
  saveEmprestimos(db);
  return true;
}

// Busca empréstimo por ID (em qualquer devedor)
function buscarEmprestimo(id) {
  const db = loadEmprestimos();
  for (const devedor of Object.keys(db)) {
    const emp = db[devedor].find(e => e.id === id);
    if (emp) return { devedor, emp };
  }
  return null;
}

module.exports = {
  setPendente,
  getPendente,
  limparPendente,
  adicionarEmprestimo,
  listarEmprestimos,
  marcarPago,
  buscarEmprestimo,
  gerarId,
};
