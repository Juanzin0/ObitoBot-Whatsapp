const { layout } = require('../../templates/layout');


const FALLBACK = [
  'A vida não é sobre esperar a tempestade passar, mas sobre aprender a dançar na chuva.',
  'O que você mais teme não é o fracasso, mas o que os outros vão pensar do seu fracasso.',
  'As pessoas se arrependem mais do que não fizeram do que do que fizeram.',
  'O propósito da vida não é ser feliz, mas ser útil.',
  'O medo não é o inimigo, mas o guardião.',
  'O tempo é a única coisa que você não pode comprar de volta.',
  'Conhecer a si mesmo é a maior sabedoria.',
  'Cada escolha é uma renúncia.',
  'A felicidade não é uma meta, mas um estado de espírito.',
  'Tudo passa. As dores, as alegrias, as pessoas.',
];

function quebrar(texto, max = 40) {
  const linhas = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > max) {
      linhas.push(atual.trim());
      atual = p;
    } else {
      atual = (atual + ' ' + p).trim();
    }
  }
  if (atual) linhas.push(atual.trim());
  return linhas;
}

module.exports = {
  name: 'reflexao',
  categoria: 'utilidades',

  async execute({ sock, msg, from }) {
    await sock.sendPresenceUpdate('composing', from);

    const reflexao = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];

    const linhasReflexao = quebrar(reflexao);

    const texto = layout({
      comando: 'reflexao',
      titulo: '🌑 𝐑𝐄𝐅𝐋𝐄𝐗𝐀̃𝐎 🌑',
      linhas: [
        ...linhasReflexao.map(l => `🌑 ${l}`),
        '🌑',
        '🌑 📖 Reflexão',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
