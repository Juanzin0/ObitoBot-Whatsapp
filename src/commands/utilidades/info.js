const { layout } = require('../../templates/layout');
const config = require('../../config/config.json');

module.exports = {
  name: 'info',
  categoria: 'utilidades',

  async execute({ sock, msg, from }) {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const donoJid = `${config.dono}@s.whatsapp.net`;

    const texto = layout({
      comando: 'info',
      titulo: '🌑 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂̧𝐎̃𝐄𝐒 🌑',
      linhas: [
        `🌑 𝘽𝙊𝙏: ${config.botName}`,
        `🌑 𝙑𝙀𝙍𝙎𝘼̃𝙊: 1.0.1-beta`,
        `🌑 𝙂𝙍𝙐𝙋𝙊: ${from.endsWith('@g.us') ? 'Sim' : 'Privado'}`,
        `🌑 𝙐𝙋𝙏𝙄𝙈𝙀: ${h}h ${m}m ${s}s`,
        `🌑 𝘿𝙊𝙉𝙊: @${config.dono}`,
        `🌑 𝙋𝙇𝘼𝙏𝘼𝙁𝙊𝙍𝙈𝘼: WhatsApp (Baileys)`,
      ],
    });

    await sock.sendMessage(from, {
      text: texto,
      mentions: [donoJid],
    }, { quoted: msg });
  }
};
