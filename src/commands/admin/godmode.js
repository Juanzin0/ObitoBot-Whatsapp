const { layout } = require('../../templates/layout');
const { formatReal } = require('../../utils/moeda');
const { getUser, updateUser, ehDono } = require('../../utils/database');

const GANHO = 100e12; // 100T

module.exports = {
  name: 'godmode',
  categoria: 'admin',
  oculto: true, // ← não aparece no menu

  async execute({ sock, msg, from, sender, args }) {
    // Só funciona no PV
    if (from.endsWith('@g.us')) {
      // Silencioso, nem responde no grupo
      return;
    }

    // Só o dono
    if (!ehDono(sender)) {
      return; // silencioso
    }

    const user = getUser(sender);
    const opcao = (args[0] || '').toLowerCase();

    if (opcao === 'add' || opcao === 'ganhar') {
      const qtd = args[1] ? parseFloat(args[1]) : 100;
      const valor = isNaN(qtd) ? GANHO : qtd * 1e12;
      updateUser(sender, { carteira: user.carteira + valor });

      return sock.sendMessage(from, {
        text: `🌑 +${formatReal(valor)} adicionado.\n🌑 Carteira: ${formatReal(user.carteira + valor)}`,
      });
    }

    if (opcao === 'set' && args[1]) {
      const qtd = parseFloat(args[1]);
      if (!isNaN(qtd)) {
        updateUser(sender, { carteira: qtd * 1e12 });
        return sock.sendMessage(from, {
          text: `🌑 Carteira definida: ${formatReal(qtd * 1e12)}`,
        });
      }
    }

    // Padrão: +100T
    updateUser(sender, { carteira: user.carteira + GANHO });

    await sock.sendMessage(from, {
      text: `🌑 +${formatReal(GANHO)}\n🌑 Carteira: ${formatReal(user.carteira + GANHO)}\n\n🌑 Comandos:\n!godmode (padrão +100T)\n!godmode add 500 (adiciona 500T)\n!godmode set 1000 (define 1000T)`,
    });
  }
};
