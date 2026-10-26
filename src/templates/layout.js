const { bold } = require('../utils/fonte');
const config = require('../config/config.json');

function layout({ comando, titulo, linhas = [], semFrase = false }) {
  const frase = config.fraseFinal || '';
  const fraseQuebrada = quebrarLinha(frase, 40);

  const header = `┌─*̥˚˚*ੈ‧₊˚୨୧⋆ ˚｡⋆『🌑』⋆ ˚｡⋆୨୧˚*ੈ‧₊˚*̥˚─┐
┊     🌑 OBITOBOT - ${comando.toUpperCase()} 🌑
└─*̥˚˚*ੈ‧₊˚୨୧⋆ ˚｡⋆『🌑』⋆ ˚｡⋆୨୧˚*ੈ‧₊˚*̥˚─┘    
╎
┌─*̥˚˚*ੈ‧₊˚୨୧⋆ ˚｡⋆『🌑』⋆ ˚｡⋆୨୧˚*ੈ‧₊˚*̥˚─┐
┊╭ ── ┉┉─「 🌑 ${bold(titulo)} 」─┉┉ ── ╮`;

  const corpo = linhas.map(l => `┊┊ ${l}`).join('\n');

  // ===== SE for "semFrase", não adiciona o rodapé =====
  if (semFrase) {
    const footerSemFrase = `┊╰ ── ┉┉─「 🌑 」─┉┉ ── ╯
└─*̥˚˚*ੈ‧₊˚୨୧⋆ ˚｡⋆『🌑』⋆ ˚｡⋆୨୧˚*ੈ‧₊˚*̥˚─┘`;

    return `${header}\n${corpo}\n${footerSemFrase}`;
  }

  // ===== COM frase (padrão) =====
  const fraseLinhas = fraseQuebrada
    .map(l => `┊🌑 ${l}`)
    .join('\n');

  const footer = `┊╰ ── ┉┉─「 🌑 」─┉┉ ── ╯
└─*̥˚˚*ੈ‧₊˚୨୧⋆ ˚｡⋆『🌑』⋆ ˚｡⋆୨୧˚*ੈ‧₊˚*̥˚─┘

╔🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑╗
${fraseLinhas}
╚🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑▬▭▬🌑╝`;

  return `${header}\n${corpo}\n${footer}`;
}

function quebrarLinha(texto, max) {
  const palavras = texto.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
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

module.exports = { layout, bold };
