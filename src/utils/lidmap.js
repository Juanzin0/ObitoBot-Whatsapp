const fs = require('fs');
const path = require('path');

const LIDMAP_PATH = path.join(__dirname, '..', 'database', 'lidmap.json');

function loadMap() {
  if (!fs.existsSync(LIDMAP_PATH)) {
    fs.mkdirSync(path.dirname(LIDMAP_PATH), { recursive: true });
    fs.writeFileSync(LIDMAP_PATH, '{}');
  }
  try {
    return JSON.parse(fs.readFileSync(LIDMAP_PATH, 'utf8') || '{}');
  } catch { return {}; }
}

function saveMap(map) {
  fs.writeFileSync(LIDMAP_PATH, JSON.stringify(map, null, 2));
}

// Registra lid -> pn
function registrarLid(lid, pn) {
  if (!lid || !pn) return;
  if (!lid.endsWith('@lid')) return;
  if (!pn.endsWith('@s.whatsapp.net')) return;

  const map = loadMap();
  if (map[lid] === pn) return;
  map[lid] = pn;
  saveMap(map);
}

// Resolve lid -> pn
function resolverLid(lid) {
  if (!lid || !lid.endsWith('@lid')) return null;
  const map = loadMap();
  return map[lid] || null;
}

// Verifica se é lid
function ehLid(jid) {
  return jid && jid.endsWith('@lid');
}

module.exports = { registrarLid, resolverLid, ehLid, loadMap };
