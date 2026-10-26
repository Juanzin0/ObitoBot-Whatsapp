// Saudações randomizadas (varia a cada msg)
const SAUDACOES = [
  'AE, {nome}! Bom te ver por aqui...',
  'Salve, {nome}! Mais um dia de vitória...',
  'Eaí, {nome}! O ObitoBot tá de olho em você...',
  'Opa, {nome}! Chegou a hora do presente...',
  'Eita, {nome}! Primeira mensagem do dia detectada...',
  'Fala, {nome}! O dia só começa quando você aparece...',
  'Boa, {nome}! Tá mantendo o ritmo, hein...',
  'Aí sim, {nome}! Mais um dia na conta...',
];

// Títulos de streak por dia (1 a 7+)
const TITULOS_STREAK = {
  1: '✦ 𝙋𝙍𝙀𝙎𝙀𝙉𝙏𝙀 𝘿𝙄Á𝙍𝙄𝙊 ✦',
  2: '✦ 𝙍𝙄𝙏𝙈𝙊 𝘾𝙊𝙉𝙎𝙏𝘼𝙉𝙏𝙀 ✦',
  3: '✦ 𝙏Á 𝙋𝙀𝙂𝘼𝙉𝘿𝙊 𝙁𝙊𝙂𝙊 ✦',
  4: '✦ 𝙄𝙈𝙋𝘼𝙍Á𝙑𝙀𝙇 ✦',
  5: '✦ 𝙈𝙀𝙏𝘼𝘿𝙀 𝘿𝙊 𝘾𝘼𝙈𝙄𝙉𝙃𝙊 ✦',
  6: '✦ 𝙌𝙐𝘼𝙎𝙀 𝙇Á ✦',
  7: '✦ 𝙇𝙀𝙉𝘿Á𝙍𝙄𝙊! 7 𝘿𝙄𝘼𝙎 ✦',
};

// Mensagens especiais por dia (além do título)
const MSGS_DIA = {
  3: '🔥 Três dias seguidos! O ObitoBot tá impressionado.',
  5: '⚡ Cinco dias! Tá quase lá, não desiste agora.',
  6: '💠 Sexto dia! Amanhã é o grande dia...',
  7: '💎 𝙎𝙀𝙏𝙀 𝘿𝙄𝘼𝙎 𝙎𝙀𝙂𝙐𝙄𝘿𝙊𝙎! Você é uma lenda!',
};

function getSaudacao(nome) {
  const idx = Math.floor(Math.random() * SAUDACOES.length);
  return SAUDACOES[idx].replace('{nome}', nome);
}

function getTituloStreak(dia) {
  if (dia >= 7) return TITULOS_STREAK[7];
  return TITULOS_STREAK[dia] || TITULOS_STREAK[1];
}

function getMsgDia(dia) {
  return MSGS_DIA[dia] || null;
}

module.exports = { getSaudacao, getTituloStreak, getMsgDia };
