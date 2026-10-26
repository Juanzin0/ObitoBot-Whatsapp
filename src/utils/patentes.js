// 20 patentes por valor da CARTEIRA (só carteira, não inclui banco)
const PATENTES = [
  { nome: 'Mendigo',           min: 0 },
  { nome: 'Favelado',          min: 1_000 },
  { nome: 'Pobre',             min: 10_000 },
  { nome: 'Trabalhador',       min: 100_000 },
  { nome: 'Classe Média',      min: 500_000 },
  { nome: 'Classe Alta',       min: 1_000_000 },
  { nome: 'Comerciante',       min: 5_000_000 },
  { nome: 'Empresário',        min: 10_000_000 },
  { nome: 'Investidor',        min: 50_000_000 },
  { nome: 'Milionário',        min: 100_000_000 },
  { nome: 'Multimilionário',   min: 500_000_000 },
  { nome: 'Bilionário',        min: 1_000_000_000 },
  { nome: 'Trilionário',       min: 1_000_000_000_000 },
  { nome: 'Quatrilionário',    min: 1_000_000_000_000_000 },
  { nome: 'Quintilionário',    min: 1_000_000_000_000_000_000 },
  { nome: 'Magnata',           min: 1e21 },
  { nome: 'Imperador',         min: 1e24 },
  { nome: 'Titã',              min: 1e27 },
  { nome: 'Lenda',             min: 1e30 },
  { nome: 'Deus do Dinheiro',  min: 1e33 },
];

function getPatente(carteira) {
  const valor = carteira || 0;
  let atual = PATENTES[0];
  for (const p of PATENTES) {
    if (valor >= p.min) atual = p;
    else break;
  }
  return atual;
}

function getPatenteIndex(carteira) {
  const valor = carteira || 0;
  let idx = 0;
  for (let i = 0; i < PATENTES.length; i++) {
    if (valor >= PATENTES[i].min) idx = i;
    else break;
  }
  return idx;
}

function getProximaPatente(carteira) {
  const idx = getPatenteIndex(carteira);
  return PATENTES[idx + 1] || null;
}

module.exports = { PATENTES, getPatente, getPatenteIndex, getProximaPatente };
