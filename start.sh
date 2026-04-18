#!/bin/bash

echo "================================================"
echo "  TC2026 - Iniciando Aplicación"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que setup se haya ejecutado
if [ ! -f ".env" ]; then
    print_error "Archivo .env no encontrado"
    echo "   Ejecuta primero: ./setup.sh"
    exit 1
fi

if [ ! -d "dashboard/server/node_modules" ]; then
    print_error "Dependencias del backend no instaladas"
    echo "   Ejecuta primero: ./setup.sh"
    exit 1
fi

if [ ! -d "dashboard/client/node_modules" ]; then
    print_error "Dependencias del frontend no instaladas"
    echo "   Ejecuta primero: ./setup.sh"
    exit 1
fi

# Verificar si Ollama está corriendo (si se usa)
source .env
if [ "$THINKING_PROVIDER" = "ollama" ]; then
    if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_warning "Ollama no está corriendo. Iniciando..."
        ollama serve &
        sleep 2
        print_success "Ollama iniciado"
    else
        print_success "Ollama está corriendo"
    fi
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo ""
echo "Iniciando backend..."
cd dashboard/server
node server.js &
BACKEND_PID=$!
cd ../..
sleep 2

# Verificar que el backend inició correctamente
if curl -s http://localhost:3001/api/users &> /dev/null; then
    print_success "Backend corriendo en http://localhost:3001"
else
    print_error "Error al iniciar backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar frontend
echo ""
echo "Iniciando frontend..."
cd dashboard/client
npm run dev &
FRONTEND_PID=$!
cd ../..
sleep 3

print_success "Frontend corriendo en http://localhost:5173"

echo ""
echo "================================================"
echo "  Aplicación Iniciada"
echo "================================================"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "  Presiona Ctrl+C para detener"
echo ""
echo "================================================"

# Mantener el script corriendo
wait
