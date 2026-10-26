const fs = require('fs');
const path = require('path');

const INV_PATH = path.join(__dirname, '..', 'database', 'inventario.json');

// ===== 38 MINÉRIOS =====
const MINERIOS = [
  // Comum
  { nome: 'carvao', exibicao: 'Carvão', emoji: '⚫', chance: 8, valor: 8, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'pedra', exibicao: 'Pedra', emoji: '🪨', chance: 7, valor: 5, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'areia', exibicao: 'Areia', emoji: '🏜️', chance: 5, valor: 3, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'argila', exibicao: 'Argila', emoji: '🧱', chance: 5, valor: 4, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'calcario', exibicao: 'Calcário', emoji: '🪨', chance: 4, valor: 6, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'sal', exibicao: 'Sal', emoji: '🧂', chance: 3, valor: 7, raridade: 'Comum', estrelas: '⭐' },
  { nome: 'gesso', exibicao: 'Gesso', emoji: '⚪', chance: 3, valor: 5, raridade: 'Comum', estrelas: '⭐' },

  // Incomum
  { nome: 'cobre', exibicao: 'Cobre', emoji: '🟠', chance: 5, valor: 25, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'estanho', exibicao: 'Estanho', emoji: '⚙️', chance: 4, valor: 30, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'ferro', exibicao: 'Ferro', emoji: '🔩', chance: 4, valor: 40, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'chumbo', exibicao: 'Chumbo', emoji: '🔘', chance: 3, valor: 35, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'niquel', exibicao: 'Níquel', emoji: '🔶', chance: 3, valor: 45, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'zinco', exibicao: 'Zinco', emoji: '⚪', chance: 3, valor: 28, raridade: 'Incomum', estrelas: '⭐⭐' },
  { nome: 'manganese', exibicao: 'Manganês', emoji: '🟣', chance: 3, valor: 38, raridade: 'Incomum', estrelas: '⭐⭐' },

  // Raro
  { nome: 'quartzo', exibicao: 'Quartzo', emoji: '💎', chance: 3.5, valor: 60, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'prata', exibicao: 'Prata', emoji: '🥈', chance: 3, valor: 100, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'ouro', exibicao: 'Ouro', emoji: '🥇', chance: 2.5, valor: 200, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'platina', exibicao: 'Platina', emoji: '⚪', chance: 2.5, valor: 180, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'cobalto', exibicao: 'Cobalto', emoji: '🔵', chance: 2, valor: 120, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'cromo', exibicao: 'Cromo', emoji: '🔘', chance: 2, valor: 110, raridade: 'Raro', estrelas: '⭐⭐⭐' },
  { nome: 'titanio', exibicao: 'Titânio', emoji: '🪶', chance: 2.5, valor: 150, raridade: 'Raro', estrelas: '⭐⭐⭐' },

  // Épico
  { nome: 'diamante', exibicao: 'Diamante', emoji: '💠', chance: 2.5, valor: 500, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'rubi', exibicao: 'Rubi', emoji: '❤️', chance: 2, valor: 450, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'safira', exibicao: 'Safira', emoji: '💙', chance: 2, valor: 480, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'topazio', exibicao: 'Topázio', emoji: '🟡', chance: 1.5, valor: 350, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'ametista', exibicao: 'Ametista', emoji: '🟣', chance: 1.5, valor: 400, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'jade', exibicao: 'Jade', emoji: '🟢', chance: 1.5, valor: 380, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },
  { nome: 'onix', exibicao: 'Ônix', emoji: '⚫', chance: 1.5, valor: 420, raridade: 'Épico', estrelas: '⭐⭐⭐⭐' },

  // Lendário
  { nome: 'esmeralda', exibicao: 'Esmeralda', emoji: '🟢', chance: 1.8, valor: 800, raridade: 'Lendário', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'cristal', exibicao: 'Cristal', emoji: '🔮', chance: 1.5, valor: 750, raridade: 'Lendário', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'opala', exibicao: 'Opala', emoji: '🌈', chance: 1.2, valor: 700, raridade: 'Lendário', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'pedra lunar', exibicao: 'Pedra Lunar', emoji: '🌙', chance: 1.2, valor: 850, raridade: 'Lendário', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'pedra solar', exibicao: 'Pedra Solar', emoji: '☀️', chance: 1.3, valor: 820, raridade: 'Lendário', estrelas: '⭐⭐⭐⭐⭐' },

  // Mítico
  { nome: 'netherite', exibicao: 'Netherite', emoji: '🔥', chance: 1, valor: 2000, raridade: 'Mítico', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'adamantium', exibicao: 'Adamantium', emoji: '💠', chance: 0.8, valor: 2500, raridade: 'Mítico', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'vibranium', exibicao: 'Vibranium', emoji: '🟣', chance: 0.7, valor: 3000, raridade: 'Mítico', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'dragonio', exibicao: 'Dragônio', emoji: '🐉', chance: 0.5, valor: 5000, raridade: 'Mítico', estrelas: '⭐⭐⭐⭐⭐' },

  // Divino
  { nome: 'estrelar', exibicao: 'Estrelar', emoji: '⭐', chance: 0.3, valor: 10000, raridade: 'Divino', estrelas: '⭐⭐⭐⭐⭐' },
  { nome: 'eterium', exibicao: 'Eterium', emoji: '✨', chance: 0.2, valor: 15000, raridade: 'Divino', estrelas: '⭐⭐⭐⭐⭐' },
];

// ===== ORDEM PRA EXIBIÇÃO =====
const ORDEM = MINERIOS.map(m => m.nome);

function inventarioPadrao() {
  const inv = {};
  for (const m of MINERIOS) inv[m.nome] = 0;
  return inv;
}

function loadInv() {
  if (!fs.existsSync(INV_PATH)) {
    fs.mkdirSync(path.dirname(INV_PATH), { recursive: true });
    fs.writeFileSync(INV_PATH, '{}');
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(INV_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveInv(inv) {
  fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));
}

function getInventario(jid) {
  const inv = loadInv();
  if (!inv[jid]) {
    inv[jid] = inventarioPadrao();
    saveInv(inv);
  }
  return inv[jid];
}

function updateInventario(jid, patch) {
  const inv = loadInv();
  if (!inv[jid]) inv[jid] = inventarioPadrao();
  inv[jid] = { ...inv[jid], ...patch };
  saveInv(inv);
  return inv[jid];
}

// ===== SORTEIA UM MINÉRIO BASEADO NAS CHANCES =====
function sortearMinerio() {
  const total = MINERIOS.reduce((a, m) => a + m.chance, 0);
  let r = Math.random() * total;
  for (const m of MINERIOS) {
    r -= m.chance;
    if (r <= 0) return m;
  }
  return MINERIOS[MINERIOS.length - 1];
}

function getMinerio(nome) {
  return MINERIOS.find(m => m.nome === nome.toLowerCase());
}

module.exports = {
  MINERIOS,
  ORDEM,
  getInventario,
  updateInventario,
  sortearMinerio,
  getMinerio,
  inventarioPadrao,
};
