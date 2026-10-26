const { layout } = require('../../templates/layout');
const { formatReal, parseMoeda } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo } = require('../../utils/database');

const CHANCE = 20;
const MINIMO = 100;

const FRASES_OK = [
  'A sorte favorece os corajosos!',
  'O risco valeu a pena!',
  'O mercado sorriu pra você hoje.',
  'Seu instinto tava afiado.',
  'O lucro é a recompensa da ousadia.',
];

const FRASES_FAIL = [
  'O risco faz parte do jogo.',
  'Nem todo investimento dá certo.',
  'O mercado é imprevisível.',
  'Aprenda com a perda e tente de novo.',
];

function frase(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  name: 'investir',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'investir',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!args[0]) {
      const texto = layout({
        comando: 'investir',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !investir 500', '🌑 Ou: !investir 1k'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const valor = parseMoeda(args[0]);
    if (isNaN(valor) || valor < MINIMO) {
      const texto = layout({
        comando: 'investir',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [`🌑 Valor mínimo: ${formatReal(MINIMO)}`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo } = getUserGrupo(sender, groupId);
    if (grupo.carteira < valor) {
      const texto = layout({
        comando: 'investir',
        titulo: '🌑 𝐒𝐄𝐌 𝐃𝐈𝐍𝐇𝐄𝐈𝐑𝐎 🌑',
        linhas: [`🌑 Você tem: ${formatReal(grupo.carteira)}`],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const ganhou = Math.random() * 100 < CHANCE;

    let retorno, percentual, resultado, f;
    if (ganhou) {
      retorno = valor * 2;
      percentual = 100;
      updateUserGrupo(sender, groupId, { carteira: grupo.carteira + valor });
      resultado = `🎉 𝙂𝘼𝙉𝙃𝙊𝙐! +${percentual}%`;
      f = frase(FRASES_OK);
    } else {
      retorno = 0;
      percentual = -100;
      updateUserGrupo(sender, groupId, { carteira: grupo.carteira - valor });
      resultado = `💔 𝙋𝙀𝙍𝘿𝙀𝙐! -100%`;
      f = frase(FRASES_FAIL);
    }

    const texto = layout({
      comando: 'investir',
      titulo: '🌑 𝐈𝐍𝐕𝐄𝐒𝐓𝐈𝐌𝐄𝐍𝐓𝐎 🌑',
      linhas: [
        `🌑 𝙄𝙉𝙑𝙀𝙎𝙏𝙄𝙐: ${formatReal(valor)}`,
        `🌑 𝙍𝙀𝙏𝙊𝙍𝙉𝙊: ${formatReal(retorno)} (${percentual}%)`,
        `🌑 ${resultado}`,
        `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(ganhou ? grupo.carteira + valor : grupo.carteira - valor)}`,
        `🌑 ${f}`,
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
