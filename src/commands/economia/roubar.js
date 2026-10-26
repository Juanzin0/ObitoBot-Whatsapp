const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const {
  getUserGrupo,
  updateUserGrupo,
  todayStr,
  ehDono,
} = require('../../utils/database');

const MAX_ROUBOS = 5;

// Reset de roubosHoje se virou o dia
function resetarSeNovoDia(grupo, groupId, jid) {
  const hoje = todayStr();
  if (grupo.dataRoubos !== hoje) {
    updateUserGrupo(jid, groupId, { roubosHoje: 0, dataRoubos: hoje });
    return { ...grupo, roubosHoje: 0, dataRoubos: hoje };
  }
  return grupo;
}

module.exports = {
  name: 'roubar',
  categoria: 'economia',

  async execute({ sock, msg, from, sender, args, mentioned }) {
    // Só funciona em grupo
    if (!from.endsWith('@g.us')) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐒Ó 𝐍𝐎 𝐆𝐑𝐔𝐏𝐎 🌑',
        linhas: ['🌑 Roubar só funciona em grupos.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const groupId = from;

    if (!mentioned || mentioned.length === 0) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Marque alguém! Ex: !roubar @user'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const alvo = mentioned[0];
    if (alvo === sender) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Você não pode roubar a si mesmo.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    let { grupo: userGrupo } = getUserGrupo(sender, groupId);
    userGrupo = resetarSeNovoDia(userGrupo, groupId, sender);

    if (userGrupo.roubosHoje >= MAX_ROUBOS) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐋𝐈𝐌𝐈𝐓𝐄 🌑',
        linhas: [`🌑 Você já roubou ${MAX_ROUBOS}x hoje!`, '🌑 Volte amanhã.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== PROTEÇÃO GODMODE =====
    if (ehDono(alvo)) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐅𝐀𝐋𝐇𝐎𝐔 🌑',
        linhas: [
          '🌑 Você tentou roubar...',
          '🌑 Mas não deu certo.',
        ],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    let { grupo: alvoGrupo } = getUserGrupo(alvo, groupId);
    alvoGrupo = resetarSeNovoDia(alvoGrupo, groupId, alvo);

    if (alvoGrupo.carteira <= 0) {
      const texto = layout({
        comando: 'roubar',
        titulo: '🌑 𝐏𝐎𝐁𝐑𝐄 🌑',
        linhas: ['🌑 Esse usuário não tem nada pra roubar.'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    // ===== ESCUDO =====
    if (alvoGrupo.escudo && alvoGrupo.escudo.usos > 0) {
      const bloqueou = Math.random() < 0.5;
      const usosRestantes = alvoGrupo.escudo.usos - 1;
      const novoEscudo = usosRestantes > 0 ? { usos: usosRestantes } : null;
      updateUserGrupo(alvo, groupId, { escudo: novoEscudo });

      if (bloqueou) {
        updateUserGrupo(sender, groupId, { roubosHoje: userGrupo.roubosHoje + 1 });
        const texto = layout({
          comando: 'roubar',
          titulo: '🌑 𝐁𝐋𝐎𝐐𝐔𝐄𝐀𝐃𝐎 🌑',
          linhas: [
            '🌑 O escudo do alvo bloqueou o roubo!',
            `🌑 Escudo restante: ${usosRestantes} usos`,
          ],
        });
        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }
    }

    const percentual = Math.random() * 0.20 + 0.10;
    const roubado = Math.max(1, Math.floor(alvoGrupo.carteira * percentual));

    updateUserGrupo(alvo, groupId, { carteira: alvoGrupo.carteira - roubado });
    updateUserGrupo(sender, groupId, {
      carteira: userGrupo.carteira + roubado,
      roubosHoje: userGrupo.roubosHoje + 1,
    });

    const texto = layout({
      comando: 'roubar',
      titulo: '🌑 𝐑𝐎𝐔𝐁𝐎 🌑',
      linhas: [
        `🌑 𝘼𝙇𝙑𝙊: @${alvo.split('@')[0]}`,
        `🌑 𝙍𝙊𝙐𝘽𝘼𝘿𝙊: ${formatReal(roubado)}`,
        `🌑 𝙎𝙀𝙐 𝙎𝘼𝙇𝘿𝙊: ${formatReal(userGrupo.carteira + roubado)}`,
        `🌑 𝙍𝙊𝙐𝘽𝙊𝙎 𝙃𝙊𝙅𝙀: ${userGrupo.roubosHoje + 1}/${MAX_ROUBOS}`,
      ],
    });

    await sock.sendMessage(from, { text: texto, mentions: [alvo] }, { quoted: msg });
  }
};
