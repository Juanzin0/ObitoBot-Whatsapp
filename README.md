<div align="center">

# 🌑 ObitoBot

### O bot de economia mais sombrio do WhatsApp

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-6.7.22-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)]()

> *"O verdadeiro inferno é estar preso em um mundo onde você não pode estar com quem você ama"*

</div>

---

## 📖 Sobre o Projeto

O **ObitoBot** é um bot de WhatsApp focado em **economia, trabalho e interação social**, inspirado no personagem Obito Uchiha de Naruto. Ele traz um sistema completo de:

- 💰 **Economia por grupo** (cada grupo tem sua própria carteira, banco e moedas)
- 💼 **Sistema de trabalho** com 39 profissões e progressão de carreira
- 🏦 **Banco completo** com depósito, saque, empréstimos e dívidas
- 🎰 **Investimentos e bolsa de valores** com criptomoedas
- 🔐 **Sistema de senha** pra proteger os dados no PV
- 🏅 **20 patentes** baseadas na riqueza
- 🎁 **Recompensas diárias** por atividade

---

## ✨ Funcionalidades

### 💼 Sistema de Trabalho
- **39 profissões** reais com diárias e metas próprias
- **Progressão de carreira** por meta ou sorte (1% de chance)
- **Trabalho extra** (2x salário, 2 usos a cada 2h)
- **Trabalho noturno** (20h às 06h)
- **Hora extra** (sáb/dom, com fator de fadiga)
- **Carteira de trabalho (CLT)** com comandos disponíveis

### 💰 Economia
- **Carteira e banco** por grupo
- **Pix** entre usuários
- **Sistema de roubo** com escudos
- **Mineração** com 38 minérios diferentes
- **Bolsa de valores** com 8 criptomoedas
- **Empréstimos** entre usuários e com o banco

### 🔐 Segurança
- **Senha de 4 dígitos** pra acessar dados no PV
- **Bloqueio de 1h** após 3 tentativas erradas
- **RG sujo** pra inadimplentes (5 dias de prazo)
- **Aliases** pra unificar LID com número de telefone

### 🎮 Interação Social
- **Recompensa diária** por primeira mensagem (+500 coins)
- **Streak de 7 dias** com bônus de +2000 coins
- **Ranking por grupo** e **ranking global**
- **Sistema de escudos** contra roubos

---

## 🚀 Instalação

### Pré-requisitos
- **Node.js** 20.x ou superior
- **npm** ou **yarn**
- Um número de WhatsApp

### Passo a passo

```bash
# Clone o repositório
git clone https://github.com/juanzin0/obitobot.git
cd obitobot

# Instale as dependências
npm install

# Configure o bot
cp src/config/config.example.json src/config/config.json
# Edite o config.json com teu número e preferências

# Rode o bot
npm start
```

### Configuração

Edite o arquivo `src/config/config.json`:

```json
{
  "botName": "ObitoBot",
  "dono": "5511999999999",
  "fraseFinal": "O verdadeiro inferno é estar preso em um mundo onde você não pode estar com quem você ama"
}
```

- **`dono`**: teu número (formato: `5511999999999`, sem `+`, sem espaço)
- **`botName`**: nome do bot (aparece no header)
- **`fraseFinal`**: frase que aparece em todos os comandos

### Conectar o WhatsApp

1. Rode o bot com `npm start`
2. Escaneie o QR Code que aparecer no terminal
3. Ou use o **pairing code** (edite `USAR_PAIRING = true` no `index.js`)

---

## 📋 Comandos

### 💼 Trabalho
| Comando | Descrição |
|---------|-----------|
| `!procuraremprego` | Arruma emprego (só se desempregado) |
| `!trabalhar` | Trabalha (3x com cooldown de 1h) |
| `!trabalhar extra` | Trabalho extra (2x salário, 2 usos/2h) |
| `!trabalhar noturno` | Trabalho noturno (20h-06h) |
| `!horaextra [horas]` | Hora extra (sáb/dom, 1-20h) |
| `!clt` | Carteira de trabalho |

### 💰 Economia
| Comando | Descrição |
|---------|-----------|
| `!carteira` | Vê saldo e bens |
| `!pix @user 1k` | Transfere dinheiro |
| `!roubar @user` | Rouba alguém (5x/dia) |
| `!minerar` | Minera minérios (5x/dia) |
| `!inventario` | Vê minérios coletados |
| `!vender-minerio [all]` | Vende minérios |

### 🏦 Banco
| Comando | Descrição |
|---------|-----------|
| `!banco` | Vê saldo do banco |
| `!depositar 1k` | Deposita (taxa 5%) |
| `!sacar 1k` | Saca do banco |
| `!emprestimo 1k` | Pede empréstimo ao banco (10% juros) |
| `!emprestar @user 1k 10` | Empresta pra alguém (taxa opcional) |
| `!pagar banco` | Paga dívida com o banco |
| `!pagar @user` | Paga dívida com alguém |
| `!minhasdividas` | Lista dívidas |

### 📈 Bolsa
| Comando | Descrição |
|---------|-----------|
| `!bolsa` | Lista cotações |
| `!bolsa comprar BTC 0.5` | Compra cripto |
| `!bolsa vender BTC 0.5` | Vende cripto |
| `!btc` | Cotação do Bitcoin |
| `!investir 500` | Investe (20% chance de dobrar) |

### 🎁 Recompensas
| Comando | Descrição |
|---------|-----------|
| `!diario` | Recompensa diária |
| `!semanal` | Recompensa semanal |
| `!mensal` | Recompensa mensal |
| `!rank` | Ranking do grupo |

### 🔐 PV (Privado)
| Comando | Descrição |
|---------|-----------|
| `!criarsenha 1234` | Cria senha de acesso |
| `!carteira` | Vê carteira de todos os grupos (com senha) |
| `!emprestar 000-000 1k` | Empresta via RG |
| `!pagar 000-000` | Paga via RG |

### 🛠️ Utilidades
| Comando | Descrição |
|---------|-----------|
| `!perfil` | Vê perfil completo |
| `!menu` | Menu de comandos |
| `!ping` | Status do bot |
| `!info` | Informações do bot |

---

## 🏗️ Estrutura do Projeto

```
obitobot/
├── index.js                    # Arquivo principal
├── package.json
├── README.md
├── LICENSE
├── .gitignore
├── auth/                       # Sessão do WhatsApp
└── src/
    ├── commands/               # Comandos organizados por categoria
    │   ├── admin/              # Comandos de admin
    │   ├── banco/              # Banco e empréstimos
    │   ├── bolsa/              # Bolsa de valores
    │   ├── economia/           # Economia geral
    │   ├── mineracao/          # Mineração
    │   └── utilidades/         # Utilidades
    ├── config/                 # Configurações
    │   ├── config.json
    │   └── config.example.json
    ├── database/               # Bancos de dados (JSON)
    │   ├── users.json
    │   ├── grupos.json
    │   ├── bolsa.json
    │   ├── inventario.json
    │   ├── grupobank.json
    │   └── emprestimos.json
    ├── templates/              # Templates de mensagem
    │   └── layout.js
    └── utils/                  # Utilitários
        ├── database.js         # Gerenciamento de dados
        ├── moeda.js            # Formatação de moeda
        ├── profissoes.js       # Sistema de profissões
        ├── patentes.js         # Sistema de patentes
        ├── bolsa.js            # Lógica da bolsa
        ├── inventario.js       # Lógica de mineração
        ├── emprestimos.js      # Sistema de empréstimos
        ├── grupobank.js        # Banco do bot
        ├── lidmap.js           # Mapeamento LID -> PN
        └── similaridade.js     # Sugestão de comandos
```

---

## 🧠 Tecnologias

<div align="center">

| Tecnologia | Uso |
|:----------:|-----|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) | Runtime JavaScript |
| ![Baileys](https://img.shields.io/badge/Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white) | API não-oficial do WhatsApp |
| ![Pino](https://img.shields.io/badge/Pino-000000?style=for-the-badge) | Logger |
| ![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white) | Armazenamento de dados |

</div>

---

## 🎯 Como Funciona

### Economia por Grupo

Cada grupo tem **sua própria economia isolada**:

```
User "Juan" no Grupo A:
  ├── Carteira: R$ 50.000
  ├── Banco: R$ 10.000
  └── Profissão: Programador

User "Juan" no Grupo B:
  ├── Carteira: R$ 500
  ├── Banco: R$ 0
  └── Profissão: Desempregado
```

Isso **evita farm** — se o usuário tá em 10 grupos, ele não ganha 10x mais.

### Sistema de Trabalho

```
Desempregado
    ↓ !procuraremprego
Faxineiro (R$ 30-60/dia)
    ↓ bater meta ou sorte
Entregador de Pizza (R$ 40-80/dia)
    ↓
... (39 profissões no total)
    ↓
Magnata do Petróleo (R$ 5M-10M/dia)
```

### Sistema de Dívidas

- **Empréstimo com o banco** → 10% de juros, 5 dias pra pagar
- **Empréstimo entre usuários** → taxa negociada
- **Não pagar em 5 dias** → RG sujo (bloqueado de economia) por 3 dias

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. Crie uma **branch** pra feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** as mudanças (`git commit -m 'feat: Minha nova feature'`)
4. **Push** pra branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

---

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) pra mais detalhes.

---

## ⚠️ Aviso Legal

Este é um projeto **não-oficial** do WhatsApp. O uso do **Baileys** pode resultar em **banimento do número**. Use por sua conta e risco.

**Recomendações:**
- Use um **número secundário**
- Evite spam
- Não viole os [Termos de Serviço do WhatsApp](https://www.whatsapp.com/legal/terms-of-service)

---

## 👨‍💻 Autor

<div align="center">

**Feito com 🌑 e ☕ por Juan**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/5511999999999)

</div>

---

<div align="center">

### 🌑 ObitoBot

*"Aqueles que não entendem a dor verdadeira nunca vão entender a verdadeira paz."*

⭐ **Se curtiu, dá uma estrela no repositório!** ⭐

</div>
