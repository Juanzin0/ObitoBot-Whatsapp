#!/bin/bash

# ============================================================
# SCRIPT: start.sh
# DESCRIÇÃO: Inicia o bot e o servidor do site ao mesmo tempo
# USO: ./start.sh
# ============================================================

echo "═══════════════════════════════════════════"
echo "🌑 OBITOBOT - INICIANDO SISTEMA"
echo "═══════════════════════════════════════════"

# ===== CORES =====
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
RESET='\033[0m'

# ===== DIRETÓRIOS =====
BOT_DIR="$HOME/ObitoBotWA"
SITE_DIR="$HOME/ObitoBotWA/app"  # <--- CAMINHO DO SEU SITE

# ===== VERIFICA SE OS DIRETÓRIOS EXISTEM =====
if [ ! -d "$BOT_DIR" ]; then
    echo -e "${VERMELHO}❌ Diretório do bot não encontrado: $BOT_DIR${RESET}"
    exit 1
fi

if [ ! -f "$SITE_DIR/server.js" ]; then
    echo -e "${AMARELO}⚠️ Arquivo do site não encontrado: $SITE_DIR/server.js${RESET}"
    echo -e "${AMARELO}   Iniciando apenas o bot...${RESET}"
    SITE_DIR=""
fi

# ===== FUNÇÃO PARA MATAR PROCESSOS ANTERIORES =====
kill_processes() {
    echo -e "${AMARELO}🔄 Matando processos anteriores...${RESET}"
    pkill -f "node.*ObitoBot" 2>/dev/null
    pkill -f "node.*server-box" 2>/dev/null
    pkill -f "nodemon" 2>/dev/null
    sleep 1
}

# ===== FUNÇÃO PARA INICIAR O BOT =====
start_bot() {
    echo -e "${AZUL}🤖 Iniciando ObitoBot...${RESET}"
    cd "$BOT_DIR" || exit 1
    
    if [ ! -d "node_modules" ]; then
        echo -e "${AMARELO}📦 Instalando dependências do bot...${RESET}"
        npm install
    fi
    
    npm run dev > logs/bot.log 2>&1 &
    BOT_PID=$!
    echo -e "${VERDE}✅ Bot iniciado (PID: $BOT_PID)${RESET}"
    echo -e "${VERDE}   Logs: $BOT_DIR/logs/bot.log${RESET}"
}

# ===== FUNÇÃO PARA INICIAR O SITE =====
start_site() {
    if [ -z "$SITE_DIR" ]; then
        return
    fi
    
    echo -e "${AZUL}🌐 Iniciando servidor do site...${RESET}"
    cd "$SITE_DIR" || return
    
    if [ ! -d "node_modules" ]; then
        echo -e "${AMARELO}📦 Instalando dependências do site...${RESET}"
        npm install
    fi
    
    # Inicia o site com node (ou npm start)
    node server.js > logs/site.log 2>&1 &
    SITE_PID=$!
    echo -e "${VERDE}✅ Site iniciado (PID: $SITE_PID)${RESET}"
    echo -e "${VERDE}   Logs: $SITE_DIR/logs/site.log${RESET}"
}

# ===== FUNÇÃO PARA MOSTRAR STATUS =====
show_status() {
    echo ""
    echo "═══════════════════════════════════════════"
    echo -e "${VERDE}✅ SISTEMA INICIADO COM SUCESSO!${RESET}"
    echo "═══════════════════════════════════════════"
    echo ""
    echo -e "${AZUL}📊 STATUS:${RESET}"
    echo -e "   🤖 Bot:   ${VERDE}Rodando${RESET} (PID: $BOT_PID)"
    if [ ! -z "$SITE_DIR" ]; then
        echo -e "   🌐 Site:  ${VERDE}Rodando${RESET} (PID: $SITE_PID)"
    fi
    echo ""
    echo -e "${AMARELO}📋 LOGS:${RESET}"
    echo "   Bot:  tail -f $BOT_DIR/logs/bot.log"
    if [ ! -z "$SITE_DIR" ]; then
        echo "   Site: tail -f $SITE_DIR/logs/site.log"
    fi
    echo ""
    echo -e "${VERMELHO}🛑 Para parar: Ctrl+C${RESET}"
    echo "═══════════════════════════════════════════"
}

# ===== FUNÇÃO PARA PARAR TUDO =====
cleanup() {
    echo ""
    echo -e "${AMARELO}🛑 Parando todos os processos...${RESET}"
    kill $BOT_PID 2>/dev/null
    if [ ! -z "$SITE_PID" ]; then
        kill $SITE_PID 2>/dev/null
    fi
    echo -e "${VERDE}✅ Todos os processos parados.${RESET}"
    exit 0
}

# ===== CAPTURA Ctrl+C =====
trap cleanup SIGINT SIGTERM

# ===== CRIA PASTA DE LOGS =====
mkdir -p "$BOT_DIR/logs"
if [ ! -z "$SITE_DIR" ]; then
    mkdir -p "$SITE_DIR/logs"
fi

# ===== EXECUTA =====
kill_processes
start_bot
start_site
show_status

# ===== MANTÉM O SCRIPT RODANDO =====
wait
