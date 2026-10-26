const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo, updateUserGrupo, semanaStr } = require('../../utils/database');
const { getProfissao } = require('../../utils/profissoes');

const MAX_HORAS = 20;

module.exports = {
  name: 'horaextra',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Hora extra só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const horas = parseInt(args[0]);

    if (!horas || horas < 1 || horas > MAX_HORAS) {
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: [
          `🌑 Escolha de 1 a ${MAX_HORAS} horas.`,
          '🌑 Ex: !horaextra 5',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const { grupo } = getUserGrupo(sender, groupId);

    if (grupo.profissaoIndex === 0) {
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐃𝐄𝐒𝐄𝐌𝐏𝐑𝐄𝐆𝐀𝐃𝐎 🌑',
        linhas: ['🌑 Use !procuraremprego primeiro.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const dia = new Date().getDay();
    if (dia !== 0 && dia !== 6) {
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐅𝐎𝐑𝐀 𝐃𝐄 𝐃𝐈𝐀 🌑',
        linhas: ['🌑 Hora extra só no fim de semana (sáb/dom).'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const agora = Date.now();
    if (grupo.horaExtraBloqueadoAte && agora < grupo.horaExtraBloqueadoAte) {
      const restante = grupo.horaExtraBloqueadoAte - agora;
      const h = Math.floor(restante / 3600000);
      const m = Math.floor((restante % 3600000) / 60000);
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐁𝐋𝐎𝐐𝐔𝐄𝐀𝐃𝐎 🌑',
        linhas: [
          '🌑 Você está exausto!',
          `🌑 Libera em: ${h}h ${m}m`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const semanaAtual = semanaStr();
    let totalSemana = grupo.horaExtraTotal || 0;
    if (grupo.horaExtraSemana !== semanaAtual) {
      totalSemana = 0;
      updateUserGrupo(sender, groupId, { horaExtraTotal: 0, horaExtraSemana: semanaAtual });
    }

    if (totalSemana + horas > MAX_HORAS) {
      const texto = layout({
        comando: 'horaextra',
        titulo: '🌑 𝐋𝐈𝐌𝐈𝐓𝐄 🌑',
        linhas: [
          `🌑 Você já fez ${totalSemana}h essa semana.`,
          `🌑 Teto: ${MAX_HORAS}h`,
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    let bloqueou = false;
    if (horas > 10) bloqueou = Math.random() < 0.5;

    const p = getProfissao(grupo.profissaoIndex);
    const diariaMedia = (p.diaria[0] + p.diaria[1]) / 2;
    const valorHora = diariaMedia / 8;
    const fatorFadiga = 1 / (1 + (horas - 1) * 0.1);
    const ganho = Math.floor(valorHora * horas * fatorFadiga);

    updateUserGrupo(sender, groupId, {
      carteira: grupo.carteira + ganho,
      horaExtraTotal: totalSemana + horas,
    });

    let bloqueioMsg = '';
    if (bloqueou) {
      if (dia === 0) {
        const proximo = new Date();
        const diasAte = (7 - proximo.getDay() + 6) % 7 + 1;
        proximo.setDate(proximo.getDate() + diasAte);
        proximo.setHours(0, 0, 0, 0);
        updateUserGrupo(sender, groupId, { horaExtraBloqueadoAte: proximo.getTime() });
        bloqueioMsg = '💀 Você passou do limite e ficou exausto! Libera só no próximo fim de semana.';
      } else {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        updateUserGrupo(sender, groupId, { horaExtraBloqueadoAte: amanha.getTime() });
        bloqueioMsg = '💀 Você passou do limite e ficou exausto! Libera amanhã (domingo).';
      }
    }

    const linhas = [
      `🌑 𝘾𝘼𝙍𝙂𝙊: ${p.nome}`,
      `🌑 𝙃𝙊𝙍𝘼𝙎: ${horas}h`,
      `🌑 𝙑𝘼𝙇𝙊𝙍/𝙃: ${formatReal(Math.floor(valorHora))}`,
      `🌑 𝙁𝘼𝙏𝙊𝙍 𝙁𝘼𝘿𝙄𝙂𝘼: ${(fatorFadiga * 100).toFixed(0)}%`,
      `🌑 𝙂𝘼𝙉𝙃𝙊: ${formatReal(ganho)}`,
      `🌑 𝘾𝘼𝙍𝙏𝙀𝙄𝙍𝘼: ${formatReal(grupo.carteira + ganho)}`,
      `🌑 𝙏𝙊𝙏𝘼𝙇 𝙉𝘼 𝙎𝙀𝙈𝘼𝙉𝘼: ${totalSemana + horas}h / ${MAX_HORAS}h`,
    ];
    if (bloqueioMsg) linhas.push('', bloqueioMsg);

    const texto = layout({
      comando: 'horaextra',
      titulo: '🌑 𝐇𝐎𝐑𝐀 𝐄𝐗𝐓𝐑𝐀 🌑',
      linhas,
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
