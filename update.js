// Migra users @lid que têm senha/dados pro @s.whatsapp.net correspondente
const { loadDB, saveDB } = require('./src/utils/database');
const { loadMap } = require('./src/utils/lidmap');

function migrar() {
  const db = loadDB();
  const map = loadMap(); // lid -> pn

  console.log('Mapa de LID -> PN:', map);
  console.log('Users no DB:', Object.keys(db).filter(k => !k.endsWith('@g.us')));

  let migrados = 0;

  for (const lid of Object.keys(map)) {
    const pn = map[lid];
    if (!db[lid]) continue;
    if (!db[pn]) {
      // não tem @s.whatsapp.net correspondente, pula
      continue;
    }

    console.log(`Migrando ${lid} → ${pn}`);

    const userLid = db[lid];
    const userPn = db[pn];

    // migra senha
    if (!userPn.senha && userLid.senha) userPn.senha = userLid.senha;
    if (!userPn.rg && userLid.rg) userPn.rg = userLid.rg;
    if (!userPn.nome && userLid.nome) userPn.nome = userLid.nome;

    // migra grupos
    if (userLid.grupos) {
      for (const gid of Object.keys(userLid.grupos)) {
        if (!userPn.grupos[gid]) {
          userPn.grupos[gid] = userLid.grupos[gid];
        }
      }
    }

    // migra aliases
    if (userLid.aliases) {
      for (const a of userLid.aliases) {
        if (!userPn.aliases.includes(a)) userPn.aliases.push(a);
      }
    }

    // adiciona lid como alias do pn
    if (!userPn.aliases.includes(lid)) userPn.aliases.push(lid);

    // apaga o @lid
    delete db[lid];

    // sincroniza aliases
    for (const a of userPn.aliases) db[a] = userPn;

    migrados++;
  }

  saveDB(db);
  console.log(`✅ ${migrados} users migrados.`);
}

migrar();
