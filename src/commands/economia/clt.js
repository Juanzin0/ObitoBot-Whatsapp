const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUserGrupo } = require('../../utils/database');
const { getProfissao } = require('../../utils/profissoes');

const COOLDOWN_NORMAL = 60 * 60 * 1000;   // 1h
const COOLDOWN_EXTRA  = 2 * 60 * 60 * 1000; // 2h
const MAX_DIARIO = 3;
const MAX_HORAS_HORAEXTRA = 20;

function isNoturno() {
  const h = new Date().getHours();
  return h >= 20 || h < 6;
}

function isFimDeSemana() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

module.exports = {
  name: 'clt',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, mentioned }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'clt',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 A carteira de trabalho só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;
    const alvo = mentioned && mentioned.length > 0 ? mentioned[0] : sender;
    const { global, grupo } = getUserGrupo(alvo, groupId);
    const p = getProfissao(grupo.profissaoIndex);

    const metaTxt = p.meta === Infinity ? '∞' : formatReal(p.meta);
    const diariaTxt = (p.diaria[0] === 0 && p.diaria[1] === 0)
      ? 'Desempregado'
      : `R$ ${p.diaria[0].toLocaleString('pt-BR')} – R$ ${p.diaria[1].toLocaleString('pt-BR')}`;

    let fotoUrl = null;
    try { fotoUrl = await sock.profilePictureUrl(alvo, 'image'); } catch {}

    const nome = global.nome || alvo.split('@')[0];
    const agora = Date.now();

    // ===== CHECA DISPONIBILIDADE DE CADA COMANDO =====
    const comandosDisponiveis = [];

    // ─── !trabalhar ───
    if (grupo.profissaoIndex > 0 && !isFimDeSemana()) {
      const ultimo = grupo.ultimoTrabalho || 0;
      const diff = agora - ultimo;
      // reseta usos se passou 1h
      let usos = grupo.trabalhosHoje || 0;
      if (diff >= COOLDOWN_NORMAL) usos = 0;
      if (usos < MAX_DIARIO) {
        comandosDisponiveis.push('🟢 !trabalhar');
      }
    }

    // ─── !trabalhar extra ───
    if (grupo.profissaoIndex > 0 && !isFimDeSemana()) {
      let usos = grupo.extraUsos;
      if (agora >= (grupo.extraReset || 0)) usos = 2;
      if (usos > 0) {
        comandosDisponiveis.push('🟢 !trabalhar extra');
      }
    }

    // ─── !trabalhar noturno ───
    if (grupo.profissaoIndex > 0 && isNoturno()) {
      comandosDisponiveis.push('🟢 !trabalhar noturno');
    }

    // ─── !horaextra ───
    if (grupo.profissaoIndex > 0 && isFimDeSemana()) {
      const bloqueado = grupo.horaExtraBloqueadoAte && agora < grupo.horaExtraBloqueadoAte;
      const totalSemana = grupo.horaExtraTotal || 0;
      if (!bloqueado && totalSemana < MAX_HORAS_HORAEXTRA) {
        comandosDisponiveis.push('🟢 !horaextra [horas]');
      }
    }

    // ===== MONTA AS LINHAS =====
    const linhas = [
      `🌑 𝙉𝙊𝙈𝙀: ${nome}`,
      `🌑 𝙍𝙂: ${global.rg}`,
      `🌑 𝘾𝘼𝙍𝙂𝙊: ${p.nome}`,
      `🌑 𝘿𝙄𝘼𝙍𝙄𝘼: ${diariaTxt}`,
      `🌑 𝙈𝙀𝙏𝘼: ${metaTxt}`,
      `🌑 𝙋𝙍𝙊𝙂𝙍𝙀𝙎𝙎𝙊: ${formatReal(grupo.progressoCarreira || 0)}`,
    ];

    // Só mostra o bloco de comandos se o user tiver emprego
    if (grupo.profissaoIndex > 0) {
      linhas.push('');
      linhas.push('🌑 𝘾𝙊𝙈𝘼𝙉𝘿𝙊𝙎 𝘿𝙄𝙎𝙋𝙊𝙉Í𝙑𝙀𝙄𝙎:');
      if (comandosDisponiveis.length > 0) {
        for (const c of comandosDisponiveis) {
          linhas.push(`🌑 ${c}`);
        }
      } else {
        linhas.push('🌑 Nenhum no momento.');
      }
    }

    const texto = layout({
      comando: 'clt',
      titulo: '🌑 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 𝐃𝐄 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 🌑',
      linhas,
    });

    if (fotoUrl) {
      await sock.sendMessage(from, {
        image: { url: fotoUrl },
        caption: texto,
        mentions: [alvo],
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
    }
  }
};
