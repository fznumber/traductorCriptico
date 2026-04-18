#!/bin/bash

echo "================================================"
echo "  TC2026 - Setup Inicial"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Verificar Node.js
echo "1. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js instalado: $NODE_VERSION"
else
    print_error "Node.js no está instalado"
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# 2. Verificar Ollama (opcional)
echo ""
echo "2. Verificando Ollama..."
if command -v ollama &> /dev/null; then
    print_success "Ollama instalado"
    
    # Verificar si Ollama está corriendo
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama está corriendo"
    else
        print_warning "Ollama no está corriendo. Iniciando..."
        ollama serve &
        sleep 2
        print_success "Ollama iniciado"
    fi
    
    # Verificar modelo qwen3.5:4b
    if ollama list | grep -q "qwen3.5:4b"; then
        print_success "Modelo qwen3.5:4b ya descargado"
    else
        print_warning "Descargando modelo qwen3.5:4b (esto puede tardar varios minutos)..."
        ollama pull qwen3.5:4b
        print_success "Modelo descargado"
    fi
else
    print_warning "Ollama no está instalado (opcional si usas NVIDIA)"
    echo "   Instala desde: https://ollama.com/download"
fi

# 3. Verificar archivo .env
echo ""
echo "3. Verificando configuración..."
if [ -f ".env" ]; then
    print_success "Archivo .env existe"
else
    print_warning "Archivo .env no existe. Creando desde .env.example..."
    cp .env.example .env
    print_success "Archivo .env creado"
    print_warning "IMPORTANTE: Edita .env y agrega tus API keys"
fi

# 4. Instalar dependencias del backend
echo ""
echo "4. Instalando dependencias del backend..."
cd dashboard/server
if [ -d "node_modules" ]; then
    print_warning "node_modules ya existe, saltando instalación"
else
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencias del backend instaladas"
    else
        print_error "Error instalando dependencias del backend"
        exit 1
    fi
fi
cd ../..

# 5. Instalar dependencias del frontend
echo ""
echo "5. Instalando dependencias del frontend..."
cd dashboard/client
if [ -d "node_modules" ]; then
    print_warning "node_modules ya existe, saltando instalación"
else
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencias del frontend instaladas"
    else
        print_error "Error instalando dependencias del frontend"
        exit 1
    fi
fi
cd ../..

# 6. Crear directorio de audio
echo ""
echo "6. Creando directorios necesarios..."
mkdir -p dashboard/client/public/audio
print_success "Directorio de audio creado"

# 7. Verificar API Keys
echo ""
echo "7. Verificando API Keys en .env..."
source .env

if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_key_here" ]; then
    print_error "ANTHROPIC_API_KEY no configurada"
    echo "   Edita .env y agrega tu API key de Anthropic"
    MISSING_KEYS=true
fi

if [ -z "$ELEVENLABS_API_KEY" ] || [ "$ELEVENLABS_API_KEY" = "tu_nueva_api_key_aqui" ]; then
    print_error "ELEVENLABS_API_KEY no configurada"
    echo "   Edita .env y agrega tu API key de ElevenLabs"
    MISSING_KEYS=true
fi

if [ "$THINKING_PROVIDER" = "nvidia" ]; then
    if [ -z "$NVIDIA_API_KEY" ] || [ "$NVIDIA_API_KEY" = "your_nvidia_api_key_here" ]; then
        print_error "NVIDIA_API_KEY no configurada (requerida si THINKING_PROVIDER=nvidia)"
        echo "   Edita .env y agrega tu API key de NVIDIA"
        MISSING_KEYS=true
    fi
fi

if [ "$MISSING_KEYS" = true ]; then
    echo ""
    print_warning "Configura las API keys faltantes en .env antes de continuar"
else
    print_success "Todas las API keys configuradas"
fi

# Resumen final
echo ""
echo "================================================"
echo "  Setup Completado"
echo "================================================"
echo ""
echo "Para iniciar el proyecto:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd dashboard/server"
echo "    node server.js"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd dashboard/client"
echo "    npm run dev"
echo ""
echo "Luego abre: http://localhost:5173"
echo ""
echo "================================================"
