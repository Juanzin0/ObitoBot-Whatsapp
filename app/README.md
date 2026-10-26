# Server Box

Painel de status do teu servidor de bolso. Feito pra rodar num celular Android velho (Termux) e ver, numa página só, se o troço tá vivo:

- **Sistema** — uptime, carga, hostname
- **Bateria** — nível, carregando ou descarregando
- **Memória e disco** — RAM, uso de disco
- **Cron** — o que tá agendado e rodando
- **Apps** — processos `node` vivos
- **News digest** — estado do `~/newsdigest` (some se não existir)

Zero dependências: Node puro, sem `npm install`, sem internet pra fora da tua rede.

> Feito pra acompanhar o guia de servidor pessoal no Moto G53 5G. MIT.

## Como rodar

No aparelho (Termux):

```bash
cd ~/app
git clone https://github.com/felipenalves/server-box.git
cd server-box
node server.js
```

Abre no navegador:

- rede local: `http://SEU_IP:8080`
- de fora (com Tailscale): `http://100.x.y.z:8080`

## Deixar rodando sempre

Com o cron ativo no Termux (`sv-enable crond`):

```bash
crontab -e
```

Adicione a linha (ajuste o caminho se o projeto não estiver em `~/app`):

```
@reboot sh ~/app/server-box/run.sh
```

## Novidades

- **Rede** — mostra hostname, IP da LAN e do Tailscale na própria página, com toque pra copiar.
- **Terminal** — as últimas linhas do log (`logs/site.log`) direto no painel, atualizando sozinho.
- **Modo economia** — se a bateria cair a 20% ou menos (e estiver descarregando), o painel passa a atualizar a cada 8s em vez de 3s, pra gastar menos bateria/dados; some quando a bateria volta a subir ou está carregando.
- **Alerta de status crítico** — quando o estado vira "crítico", o navegador vibra (se suportado) e toca um beep curto.
- 🎉 Easter egg: toque 5x rápido no relógio no topo da página.

## Termux, do zero

```bash
pkg update && pkg upgrade
pkg install nodejs git termux-api   # termux-api é opcional, só pra ler a bateria certinho
termux-setup-storage                # se for usar leitura de arquivos fora do Termux
cd ~/app
git clone https://github.com/felipenalves/server-box.git
cd server-box
node server.js
```

Sem `termux-api` instalado o painel continua funcionando normal — só a bateria cai pro fallback de `/sys/class/power_supply` ou fica "sem leitura".

## Testes

```bash
node --test test/*.test.mjs
```

## Segurança

- Acesso só pela tua rede (local ou Tailscale). Não abra porta no roteador.
- Headers de segurança básicos (nosniff, frame deny, referrer policy).
- Sem PIN de propósito: a proteção é a rede, não uma senha de 4 dígitos.