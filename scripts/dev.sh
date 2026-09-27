#!/usr/bin/env bash
set -e

# Garante a execucao a partir da raiz do repositorio
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Detecta o comando docker compose disponivel no sistema
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "Erro: Docker Compose nao foi encontrado no sistema." >&2
    exit 1
fi

# Define o arquivo de variaveis de ambiente de desenvolvimento
ENV_FILE=".env.docker"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo "Aviso: Arquivo $ENV_FILE nao encontrado. Utilizando .env padrao se existir."
        ENV_FILE=".env"
    fi
fi

echo "=================================================="
echo "PromoCuts - Ambiente Docker (Desenvolvimento)"
echo "Arquivo de ambiente: $ENV_FILE"
echo "=================================================="

echo "[1/3] Parando containers existentes..."
$COMPOSE_CMD --env-file "$ENV_FILE" down

echo "[2/3] Construindo e subindo servicos..."
$COMPOSE_CMD --env-file "$ENV_FILE" up -d --build

echo "[3/3] Exibindo logs do container app (Ctrl+C para sair)..."
$COMPOSE_CMD --env-file "$ENV_FILE" logs -f app
