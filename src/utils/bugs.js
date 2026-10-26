const fs = require('fs');
const path = require('path');

const BUGS_PATH = path.join(__dirname, '..', 'database', 'bugs.json');

function loadBugs() {
  if (!fs.existsSync(BUGS_PATH)) {
    fs.mkdirSync(path.dirname(BUGS_PATH), { recursive: true });
    fs.writeFileSync(BUGS_PATH, '[]');
    return [];
  }
  try {
    const dados = JSON.parse(fs.readFileSync(BUGS_PATH, 'utf8'));
    return Array.isArray(dados) ? dados : [];
  } catch {
    fs.writeFileSync(BUGS_PATH, '[]');
    return [];
  }
}

function saveBugs(bugs) {
  fs.writeFileSync(BUGS_PATH, JSON.stringify(bugs, null, 2));
}

// ===== GERA ID SEQUENCIAL =====
// Pega o menor número livre que não tá em uso por bug ATIVO
// Bugs corrigidos/recusados LIBERAM o número
function gerarId(bugs) {
  const ativos = bugs.filter(b => b.status !== 'CORRIGIDO' && b.status !== 'RECUSADO');
  const usados = new Set(ativos.map(b => parseInt(b.id)));

  let n = 1;
  while (usados.has(n)) n++;

  // Formata com 2 dígitos (01, 02, ..., 99)
  return String(n).padStart(2, '0');
}

function criarBug(dados) {
  const bugs = loadBugs();
  const id = gerarId(bugs);
  const bug = { ...dados, id };
  bugs.push(bug);
  saveBugs(bugs);
  return bug;
}

function atualizarBug(id, patch) {
  const bugs = loadBugs();
  const idx = bugs.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bugs[idx] = { ...bugs[idx], ...patch };
  saveBugs(bugs);
  return bugs[idx];
}

function getBug(id) {
  const bugs = loadBugs();
  return bugs.find(b => b.id === id) || null;
}

module.exports = { loadBugs, saveBugs, criarBug, atualizarBug, getBug, gerarId };
