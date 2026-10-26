const fs = require('fs');
const path = require('path');

const GRUPOBANK_PATH = path.join(__dirname, '..', 'database', 'grupobank.json');

function loadGB() {
  if (!fs.existsSync(GRUPOBANK_PATH)) {
    fs.mkdirSync(path.dirname(GRUPOBANK_PATH), { recursive: true });
    fs.writeFileSync(GRUPOBANK_PATH, JSON.stringify({ saldo: 0, historico: [] }, null, 2));
    return { saldo: 0, historico: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(GRUPOBANK_PATH, 'utf8'));
  } catch {
    return { saldo: 0, historico: [] };
  }
}

function saveGB(db) {
  fs.writeFileSync(GRUPOBANK_PATH, JSON.stringify(db, null, 2));
}

function getSaldo() {
  return loadGB().saldo || 0;
}

function adicionar(valor, motivo = '') {
  const db = loadGB();
  db.saldo = (db.saldo || 0) + valor;
  db.historico.push({ valor, motivo, data: Date.now() });
  if (db.historico.length > 100) db.historico.shift();
  saveGB(db);
  return db.saldo;
}

function remover(valor, motivo = '') {
  const db = loadGB();
  if ((db.saldo || 0) < valor) return false;
  db.saldo -= valor;
  db.historico.push({ valor: -valor, motivo, data: Date.now() });
  if (db.historico.length > 100) db.historico.shift();
  saveGB(db);
  return true;
}

module.exports = { getSaldo, adicionar, remover };
