const { layout } = require('../../templates/layout');

module.exports = {
  name: 'menu',
  categoria: 'utilidades',

  async execute({ sock, msg, from }) {
    const texto = layout({
      comando: 'menu',
      titulo: '🌑 𝐌𝐄𝐍𝐔 🌑',
      linhas: [
        '╔🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╗',
        '┊╭ ── ┉┉─「 🌑 𝐌𝐄𝐍𝐔𝐒 🌑 」─┉┉ ── ╮',
        '┊┊ 💰 !economia',
        '┊┊ 🛡️ !menuadm           🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 🤪 !zoeira             🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 🎮 !brincadeiras        🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 🛒 !loja                🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 🎰 !cassino             🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊╰ ── ┉┉─「 🌑 」─┉┉ ── ╯',
        '╚🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╝',
        '🌑',
        '╔🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╗',
        '┊╭ ── ┉┉─「 🌑 𝐅𝐄𝐑𝐑𝐀𝐌𝐄𝐍𝐓𝐀𝐒 🌑 」─┉┉ ── ╮',
        '┊┊ 🌑 📡 !ping',
        '┊┊ 🌑 🧪 !simular',
        '┊╰ ── ┉┉─「 🌑 」─┉┉ ── ╯',
        '╚🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╝',
        '🌑',
        '╔🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╗',
        '┊╭ ── ┉┉─「 🌑 𝐈𝐍𝐅𝐎𝐒 🌑 」─┉┉ ── ╮',
        '┊┊ ℹ️ !info               🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 👑 !dono               🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 👥 !infogrupo          🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 📊 !dados              🚧 (EM DESENVOLVIMENTO) 🚧',
        '┊┊ 👤 !perfil',
        '┊╰ ── ┉┉─「 🌑 」─┉┉ ── ╯',
        '╚🌑▬▭▬🌑▬▭▬>🌑<▬▭▬🌑▬▭▬🌑╝',
      ],
    });

    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
