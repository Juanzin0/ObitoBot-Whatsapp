const { default: makeWASocket, useMultiFileAuthState, Browsers, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: Browsers.macOS('Desktop'),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    if (u.qr) qrcode.generate(u.qr, { small: true });
    if (u.connection === 'open') console.log('🌑 Conectado!');
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const txt = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    console.log('🌑 MSG recebida:', JSON.stringify(txt));

    if (txt.trim() !== '!teste') return;

    const from = msg.key.remoteJid;
    console.log('🌑 Mandando teste pra', from);

    // ============ TESTE 1: botão simples formato antigo ============
    try {
      await sock.sendMessage(from, {
        text: '🌑 TESTE A — botão simples',
        footer: 'ObitoBot',
        buttons: [
          { buttonId: 'id_a1', buttonText: { displayText: '✅ A1' }, type: 1 },
          { buttonId: 'id_a2', buttonText: { displayText: '❌ A2' }, type: 1 },
        ],
        headerType: 1,
      }, { quoted: msg });
      console.log('🌑 TESTE A enviado (buttons antigo)');
    } catch (e) {
      console.error('❌ TESTE A falhou:', e.message);
    }

    await new Promise(r => setTimeout(r, 1500));

    // ============ TESTE 2: interactiveMessage (novo) ============
    try {
      const interactive = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({
          text: '🌑 TESTE B — interactive message',
        }),
        footer: proto.Message.InteractiveMessage.Footer.create({
          text: 'ObitoBot',
        }),
        header: proto.Message.InteractiveMessage.Header.create({
          title: '🌑 TESTE B',
          hasMediaAttachment: false,
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
          buttons: [
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '✅ B1',
                id: 'id_b1',
              }),
            },
            {
              name: 'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '❌ B2',
                id: 'id_b2',
              }),
            },
          ],
        }),
      });

      const waMsg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: interactive,
          },
        },
      }, { userJid: from });

      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
      console.log('🌑 TESTE B enviado (interactive novo)');
    } catch (e) {
      console.error('❌ TESTE B falhou:', e.message);
    }

    await new Promise(r => setTimeout(r, 1500));

    // ============ TESTE 3: lista interativa ============
    try {
      const list = proto.Message.ListMessage.create({
        title: '🌑 TESTE C',
        description: 'Lista de teste',
        buttonText: '📋 ABRIR LISTA',
        listType: 1,
        sections: [
          {
            title: 'SEÇÃO 1',
            rows: [
              { title: '✅ C1', rowId: 'id_c1', description: 'Opção 1' },
              { title: '❌ C2', rowId: 'id_c2', description: 'Opção 2' },
            ],
          },
        ],
      });

      const waMsg = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            listMessage: list,
          },
        },
      }, { userJid: from });

      await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
      console.log('🌑 TESTE C enviado (list)');
    } catch (e) {
      console.error('❌ TESTE C falhou:', e.message);
    }
  });
}

start();
