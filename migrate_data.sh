#!/bin/bash

# Script de migração de dados de MySQL para PostgreSQL usando pgloader
# Requisitos: Docker instalado e acesso aos bancos de dados

# 1. Defina suas variáveis (NÃO COLOQUE SENHAS REAIS AQUI. Use variáveis de ambiente)
MYSQL_USER=${MYSQL_USER:-"root"}
MYSQL_PASS=${MYSQL_PASS:-"new_password"}
MYSQL_HOST=${MYSQL_HOST:-"horarios_mysql"} # Nome do serviço no docker-compose
MYSQL_PORT=${MYSQL_PORT:-"3306"}           # Porta interna do container MySQL
MYSQL_DB=${MYSQL_DB:-"horarios_db"}

PG_USER=${PG_USER:-"user_horarios"}
PG_PASS=${PG_PASS:-"user_password"}
PG_HOST=${PG_HOST:-"horarios_postgres"}    # Nome do serviço no docker-compose
PG_PORT=${PG_PORT:-"5432"}                 # Porta interna do container Postgres
PG_DB=${PG_DB:-"horarios_db"}
NETWORK_NAME=${NETWORK_NAME:-"horarios_default"} # Nome da rede do docker-compose

echo "Iniciando migração de $MYSQL_DB (MySQL) para $PG_DB (Postgres)..."

# 2. Comando do pgloader via container Docker
docker run --rm -it --network $NETWORK_NAME dimitri/pgloader:latest pgloader \
  "mysql://$MYSQL_USER:$MYSQL_PASS@$MYSQL_HOST:$MYSQL_PORT/$MYSQL_DB" \
  "postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB"

echo "Migração finalizada."
