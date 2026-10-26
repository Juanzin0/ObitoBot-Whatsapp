// 39 profissões em ordem linear — cada uma com diária [min, max] e meta própria
// Index 0 = Desempregado (ponto de partida)
const PROFISSOES = [
  { nome: 'Desempregado',                diaria: [0, 0],              meta: 0 },
  { nome: 'Faxineiro',                   diaria: [30, 60],            meta: 1_000 },
  { nome: 'Entregador de Pizza',         diaria: [40, 80],            meta: 2_500 },
  { nome: 'Frentista',                   diaria: [50, 100],           meta: 5_000 },
  { nome: 'Garçom',                      diaria: [60, 120],           meta: 10_000 },
  { nome: 'Lavador de Carros',           diaria: [70, 140],           meta: 18_000 },
  { nome: 'Pedreiro',                    diaria: [100, 200],          meta: 30_000 },
  { nome: 'Motorista de App',            diaria: [120, 240],          meta: 50_000 },
  { nome: 'Vendedor',                    diaria: [150, 300],          meta: 80_000 },
  { nome: 'Atendente de Loja',           diaria: [180, 350],          meta: 120_000 },
  { nome: 'Padeiro',                     diaria: [200, 400],          meta: 180_000 },
  { nome: 'Eletricista',                 diaria: [300, 600],          meta: 260_000 },
  { nome: 'Mecânico',                    diaria: [350, 700],          meta: 380_000 },
  { nome: 'Cozinheiro',                  diaria: [400, 800],          meta: 550_000 },
  { nome: 'Barbeiro',                    diaria: [450, 900],          meta: 800_000 },
  { nome: 'Técnico de Informática',      diaria: [600, 1_200],        meta: 1_200_000 },
  { nome: 'Programador',                 diaria: [1_000, 2_000],      meta: 2_000_000 },
  { nome: 'Designer',                    diaria: [1_200, 2_400],      meta: 3_200_000 },
  { nome: 'Enfermeiro',                  diaria: [1_500, 3_000],      meta: 5_000_000 },
  { nome: 'Professor',                   diaria: [1_800, 3_500],      meta: 8_000_000 },
  { nome: 'Contador',                    diaria: [2_200, 4_500],      meta: 13_000_000 },
  { nome: 'Advogado',                    diaria: [3_500, 7_000],      meta: 20_000_000 },
  { nome: 'Engenheiro',                  diaria: [4_500, 9_000],      meta: 32_000_000 },
  { nome: 'Arquiteto',                   diaria: [5_000, 10_000],     meta: 50_000_000 },
  { nome: 'Dentista',                    diaria: [6_000, 12_000],     meta: 80_000_000 },
  { nome: 'Veterinário',                 diaria: [6_500, 13_000],     meta: 130_000_000 },
  { nome: 'Médico',                      diaria: [10_000, 20_000],    meta: 220_000_000 },
  { nome: 'Piloto de Avião',             diaria: [15_000, 30_000],    meta: 380_000_000 },
  { nome: 'Empresário',                  diaria: [25_000, 50_000],    meta: 650_000_000 },
  { nome: 'Juiz',                        diaria: [40_000, 80_000],    meta: 1_100_000_000 },
  { nome: 'Delegado',                    diaria: [60_000, 120_000],   meta: 2_000_000_000 },
  { nome: 'CEO',                         diaria: [100_000, 200_000],  meta: 3_500_000_000 },
  { nome: 'Cirurgião',                   diaria: [150_000, 300_000],  meta: 6_000_000_000 },
  { nome: 'Investidor',                  diaria: [250_000, 500_000],  meta: 10_000_000_000 },
  { nome: 'Político',                    diaria: [400_000, 800_000],  meta: 20_000_000_000 },
  { nome: 'Magnata',                     diaria: [700_000, 1_400_000], meta: 40_000_000_000 },
  { nome: 'Empreendedor de Tecnologia',  diaria: [1_200_000, 2_400_000], meta: 80_000_000_000 },
  { nome: 'Banqueiro',                   diaria: [2_000_000, 4_000_000], meta: 160_000_000_000 },
  { nome: 'Magnata do Petróleo',         diaria: [5_000_000, 10_000_000], meta: Infinity },
];

function getProfissao(index) {
  if (index < 0 || isNaN(index)) index = 0;
  if (index >= PROFISSOES.length) index = PROFISSOES.length - 1;
  return PROFISSOES[index];
}

function sortearSalario(index) {
  const p = getProfissao(index);
  const [min, max] = p.diaria;
  if (min === 0 && max === 0) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMeta(index) {
  return getProfissao(index).meta;
}

function getTotal() {
  return PROFISSOES.length;
}

// ===== COMPATIBILIDADE com código antigo que usa getNivel/sortearProfissao =====
function getNivel(n) {
  return getProfissao(n);
}

function sortearProfissao(index) {
  return getProfissao(index).nome;
}

module.exports = {
  PROFISSOES,
  getProfissao,
  sortearSalario,
  getMeta,
  getTotal,
  // compat
  getNivel,
  sortearProfissao,
};
