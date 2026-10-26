// Map compartilhado: jid -> { timestamp, groupId? }
const ESPERANDO_SENHA = new Map();

function marcarEsperando(jid) {
  ESPERANDO_SENHA.set(jid, { timestamp: Date.now() });
}

function estaEsperando(jid) {
  const dado = ESPERANDO_SENHA.get(jid);
  if (!dado) return false;
  // expira em 1 min
  if (Date.now() - dado.timestamp > 60 * 1000) {
    ESPERANDO_SENHA.delete(jid);
    return false;
  }
  return true;
}

function limparEspera(jid) {
  ESPERANDO_SENHA.delete(jid);
}

module.exports = { marcarEsperando, estaEsperando, limparEspera };
