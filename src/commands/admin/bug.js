const { layout } = require('../../templates/layout');
const { ehDono, getUser, updateUser } = require('../../utils/database');
const { criarBug, loadBugs, getBug, atualizarBug } = require('../../utils/bugs');
const { formatReal } = require('../../utils/moeda');
const config = require('../../config/config.json');

const RECOMPENSA_PADRAO = 5000;

// ===== PEGA NOME DO GRUPO =====
async function getNomeGrupo(sock, jid) {
  if (!jid || !jid.endsWith('@g.us')) return 'PV (privado)';
  try {
    const meta = await sock.groupMetadata(jid);
    return meta.subject || 'Grupo desconhecido';
  } catch (e) {
    return 'Grupo desconhecido';
  }
}

module.exports = {
  name: 'bug',
  categoria: 'admin',

  async execute({ sock, msg, from, sender, args }) {
    const sub = (args[0] || '').toLowerCase();

    if (ehDono(sender)) {
      // ===== LISTAR =====
      if (sub === 'listar' || sub === 'lista' || sub === 'ls') {
        const bugs = loadBugs();
        const pendentes = bugs.filter(b => b.status !== 'CORRIGIDO' && b.status !== 'RECUSADO');

        if (pendentes.length === 0) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐁𝐔𝐆𝐒 🌑',
            linhas: ['🌑 Nenhum bug pendente! ✅'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        const linhas = [`🌑 𝙏𝙤𝙩𝙖𝙡: ${pendentes.length}`, '🌑'];

        for (const b of pendentes.slice(0, 10)) {
          const emoji = b.status === 'PENDENTE' ? '🟡' : '🟠';
          const desc = b.descricao.length > 35 ? b.descricao.substring(0, 32) + '...' : b.descricao;
          linhas.push(`🌑 ${emoji} 𝙄𝘿: ${b.id}`);
          linhas.push(`🌑    ${desc}`);
          linhas.push(`🌑    por ${b.reportadorNome}`);
          linhas.push(`🌑    📍 ${b.grupoNome || 'PV'}`);
          linhas.push(`🌑    ${b.status}`);
          linhas.push('🌑');
        }

        if (pendentes.length > 10) {
          linhas.push(`🌑 ... e mais ${pendentes.length - 10}`);
        }

        linhas.push('🌑 𝘾𝙤𝙢𝙖𝙣𝙙𝙤𝙨:');
        linhas.push('🌑 !bug aceitar <id>');
        linhas.push('🌑 !bug recusar <id> <motivo>');
        linhas.push('🌑 !bug corrigir <id> [recompensa]');

        const texto = layout({
          comando: 'bug',
          titulo: '🌑 𝐁𝐔𝐆𝐒 🌑',
          linhas,
        });

        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      // ===== ACEITAR =====
      if (sub === 'aceitar' || sub === 'aceita') {
        if (!args[1]) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Use: !bug aceitar <id>'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        const id = args[1].padStart(2, '0');
        const bug = getBug(id);
        if (!bug) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Bug não encontrado!'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        if (bug.status !== 'PENDENTE') {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: [`🌑 Status atual: ${bug.status}`],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        atualizarBug(id, {
          status: 'EM CORREÇÃO',
          aceitoEm: new Date().toLocaleString('pt-BR'),
        });

        // ===== AVISO NO GRUPO =====
        if (bug.grupoJid) {
          const avisoGrupo = layout({
            comando: 'bug',
            titulo: '🌑 𝐁𝐔𝐆 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
            linhas: [
              `🌑 𝙄𝘿: ${id}`,
              `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
              `🌑 𝘿𝙚𝙨𝙘𝙧𝙞𝙘̧𝙖̃𝙤: ${bug.descricao}`,
              '🌑 ─────────────',
              '🌑 🟠 𝙎𝙩𝙖𝙩𝙪𝙨: EM CORREÇÃO',
            ],
          });

          try {
            await sock.sendMessage(bug.grupoJid, {
              text: avisoGrupo,
              mentions: [bug.reportador],
            });
          } catch (e) {}
        }

        // ===== AVISO NO PV DO REPORTADOR =====
        if (bug.reportador !== sender) {
          try {
            const avisoPV = layout({
              comando: 'bug',
              titulo: '🌑 𝐁𝐔𝐆 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
              linhas: [
                `🌑 𝙄𝘿: ${id}`,
                '🌑 𝙎𝙩𝙖𝙩𝙪𝙨: 🟠 EM CORREÇÃO',
                '🌑 Logo será corrigido!',
              ],
            });
            await sock.sendMessage(bug.reportador, { text: avisoPV });
          } catch (e) {}
        }

        // ===== CONFIRMAÇÃO PRO DONO =====
        const texto = layout({
          comando: 'bug',
          titulo: '🌑 𝐁𝐔𝐆 𝐀𝐂𝐄𝐈𝐓𝐎 🌑',
          linhas: [
            `🌑 𝙄𝘿: ${id}`,
            `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
            `🌑 📍 𝙂𝙧𝙪𝙥𝙤: ${bug.grupoNome || 'PV'}`,
            '🌑 🟠 𝙎𝙩𝙖𝙩𝙪𝙨: EM CORREÇÃO',
          ],
        });

        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      // ===== RECUSAR =====
      if (sub === 'recusar' || sub === 'recusa') {
        if (args.length < 3) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Use: !bug recusar <id> <motivo>'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        const id = args[1].padStart(2, '0');
        const motivo = args.slice(2).join(' ');
        const bug = getBug(id);

        if (!bug) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Bug não encontrado!'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        atualizarBug(id, {
          status: 'RECUSADO',
          motivoRecusa: motivo,
          recusadoEm: new Date().toLocaleString('pt-BR'),
        });

        // ===== AVISO NO GRUPO =====
        if (bug.grupoJid) {
          const avisoGrupo = layout({
            comando: 'bug',
            titulo: '🌑 𝐁𝐔𝐆 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
            linhas: [
              `🌑 𝙄𝘿: ${id}`,
              `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
              `🌑 𝙈𝙤𝙩𝙞𝙫𝙤: ${motivo}`,
              '🌑 ─────────────',
              '🌑 🔴 𝙎𝙩𝙖𝙩𝙪𝙨: RECUSADO',
            ],
          });

          try {
            await sock.sendMessage(bug.grupoJid, {
              text: avisoGrupo,
              mentions: [bug.reportador],
            });
          } catch (e) {}
        }

        // ===== AVISO NO PV =====
        if (bug.reportador !== sender) {
          try {
            const avisoPV = layout({
              comando: 'bug',
              titulo: '🌑 𝐁𝐔𝐆 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
              linhas: [
                `🌑 𝙄𝘿: ${id}`,
                `🌑 𝙈𝙤𝙩𝙞𝙫𝙤: ${motivo}`,
                '🌑 🔴 Status: RECUSADO',
              ],
            });
            await sock.sendMessage(bug.reportador, { text: avisoPV });
          } catch (e) {}
        }

        const texto = layout({
          comando: 'bug',
          titulo: '🌑 𝐁𝐔𝐆 𝐑𝐄𝐂𝐔𝐒𝐀𝐃𝐎 🌑',
          linhas: [
            `🌑 𝙄𝘿: ${id}`,
            `🌑 📍 𝙂𝙧𝙪𝙥𝙤: ${bug.grupoNome || 'PV'}`,
            `🌑 𝙈𝙤𝙩𝙞𝙫𝙤: ${motivo}`,
          ],
        });

        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }

      // ===== CORRIGIR =====
      if (sub === 'corrigir' || sub === 'corrige') {
        if (!args[1]) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: [
              '🌑 Use: !bug corrigir <id> [valor]',
              '🌑 Ex: !bug corrigir 01 10000',
            ],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        const id = args[1].padStart(2, '0');
        const bug = getBug(id);
        if (!bug) {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Bug não encontrado!'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        if (bug.status === 'CORRIGIDO') {
          const texto = layout({
            comando: 'bug',
            titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
            linhas: ['🌑 Esse bug já foi corrigido!'],
          });
          return sock.sendMessage(from, { text: texto }, { quoted: msg });
        }

        let recompensa = RECOMPENSA_PADRAO;
        if (args[2]) {
          const { parseMoeda } = require('../../utils/moeda');
          const valor = parseMoeda(args[2]);
          if (!isNaN(valor) && valor > 0) recompensa = valor;
        }

        atualizarBug(id, {
          status: 'CORRIGIDO',
          corrigidoEm: new Date().toLocaleString('pt-BR'),
          recompensaPaga: recompensa,
        });

        const reportador = getUser(bug.reportador);
        updateUser(bug.reportador, {
          carteira: (reportador.carteira || 0) + recompensa,
        });

        // ===== AVISO NO GRUPO =====
        if (bug.grupoJid) {
          const avisoGrupo = layout({
            comando: 'bug',
            titulo: '🌑 𝐁𝐔𝐆 𝐂𝐎𝐑𝐑𝐈𝐆𝐈𝐃𝐎 🌑',
            linhas: [
              `🌑 𝙄𝘿: ${id}`,
              `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
              `🌑 𝘿𝙚𝙨𝙘𝙧𝙞𝙘̧𝙖̃𝙤: ${bug.descricao}`,
              '🌑 ─────────────',
              `🌑 💰 𝙍𝙚𝙘𝙤𝙢𝙥𝙚𝙣𝙨𝙖: ${formatReal(recompensa)}`,
              '🌑 🟢 𝙎𝙩𝙖𝙩𝙪𝙨: CORRIGIDO',
            ],
          });

          try {
            await sock.sendMessage(bug.grupoJid, {
              text: avisoGrupo,
              mentions: [bug.reportador],
            });
          } catch (e) {}
        }

        // ===== AVISO NO PV =====
        if (bug.reportador !== sender) {
          try {
            const avisoPV = layout({
              comando: 'bug',
              titulo: '🌑 𝐁𝐔𝐆 𝐂𝐎𝐑𝐑𝐈𝐆𝐈𝐃𝐎 🌑',
              linhas: [
                `🌑 𝙄𝘿: ${id}`,
                '🌑 🟢 Status: CORRIGIDO',
                `🌑 💰 𝙍𝙚𝙘𝙤𝙢𝙥𝙚𝙣𝙨𝙖: ${formatReal(recompensa)}`,
                '🌑 Caiu na sua carteira! 🎉',
              ],
            });
            await sock.sendMessage(bug.reportador, { text: avisoPV });
          } catch (e) {}
        }

        const texto = layout({
          comando: 'bug',
          titulo: '🌑 𝐁𝐔𝐆 𝐂𝐎𝐑𝐑𝐈𝐆𝐈𝐃𝐎 🌑',
          linhas: [
            `🌑 𝙄𝘿: ${id}`,
            `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
            `🌑 📍 𝙂𝙧𝙪𝙥𝙤: ${bug.grupoNome || 'PV'}`,
            `🌑 💰 𝙍𝙚𝙘𝙤𝙢𝙥𝙚𝙣𝙨𝙖: ${formatReal(recompensa)}`,
          ],
        });

        return sock.sendMessage(from, { text: texto }, { quoted: msg });
      }
    }

    // ============================================================
    // REPORTAR BUG
    // ============================================================
    if (!args[0]) {
      const texto = layout({
        comando: 'bug',
        titulo: '🌑 𝐄𝐑𝐑𝐎 🌑',
        linhas: ['🌑 Use: !bug o comando X não funciona'],
      });
      return sock.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const descricao = args.join(' ');

    // ===== PEGA NOME E JID DO GRUPO =====
    const grupoJid = from.endsWith('@g.us') ? from : null;
    const grupoNome = await getNomeGrupo(sock, from);

    const bug = criarBug({
      reportador: sender,
      reportadorNome: msg.pushName || 'Desconhecido',
      descricao,
      data: new Date().toLocaleString('pt-BR'),
      status: 'PENDENTE',
      grupoJid,
      grupoNome,
    });

    // ===== AVISO NO GRUPO (resposta pro user) =====
    const respostaGrupo = layout({
      comando: 'bug',
      titulo: '🌑 𝐁𝐔𝐆 🌑',
      linhas: [
        '🌑 Bug reportado com sucesso!',
        `🌑 𝙄𝘿: ${bug.id}`,
        '🌑 O dono foi notificado.',
        `🌑 𝙍𝙚𝙘𝙤𝙢𝙥𝙚𝙣𝙨𝙖: até ${formatReal(RECOMPENSA_PADRAO)}`,
      ],
    });

    await sock.sendMessage(from, { text: respostaGrupo }, { quoted: msg });

    // ===== AVISO NO PV DO DONO =====
    const donoJid = `${config.dono}@s.whatsapp.net`;

    if (sender !== donoJid) {
      try {
        const avisoDono = layout({
          comando: 'bug',
          titulo: '🌑 𝐍𝐎𝐕𝐎 𝐁𝐔𝐆 🌑',
          linhas: [
            `🌑 𝙄𝘿: ${bug.id}`,
            `🌑 𝙍𝙚𝙥𝙤𝙧𝙩𝙖𝙙𝙤 𝙥𝙤𝙧: ${bug.reportadorNome}`,
            `🌑 𝙂𝙧𝙪𝙥𝙤: ${grupoNome}`,
            `🌑 𝘿𝙚𝙨𝙘𝙧𝙞𝙘̧𝙖̃𝙤: ${descricao}`,
            `🌑 𝘿𝙖𝙩𝙖: ${bug.data}`,
            '🌑 ─────────────',
            '🌑 🟡 𝙎𝙩𝙖𝙩𝙪𝙨: PENDENTE',
            '🌑',
            '🌑 Use: !bug listar',
          ],
        });

        await sock.sendMessage(donoJid, { text: avisoDono });
      } catch (e) {
        console.log('🌑 ERRO ao avisar dono:', e.message);
      }
    }
  }
};
