#!/bin/bash

# Script de instalación del sistema de grafos de conocimiento para TC2026

echo "================================================"
echo "  TC2026 - Instalación de Grafos de Conocimiento"
echo "================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "ejecutar_fase1.sh" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio raíz del proyecto TC2026"
    exit 1
fi

echo "✓ Directorio correcto detectado"
echo ""

# Verificar dependencias del sistema
echo "Verificando dependencias del sistema..."

# Verificar jq
if ! command -v jq &> /dev/null; then
    echo "❌ jq no está instalado. Instalando..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y jq
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    else
        echo "Por favor instala jq manualmente: https://stedolan.github.io/jq/download/"
        exit 1
    fi
fi
echo "✓ jq instalado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18+ desde https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js $(node --version) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm"
    exit 1
fi
echo "✓ npm $(npm --version) detectado"

echo ""
echo "Instalando dependencias del dashboard..."

# Instalar dependencias del servidor
cd dashboard
if [ ! -d "node_modules" ]; then
    echo "→ Instalando dependencias del servidor..."
    npm install
else
    echo "✓ Dependencias del servidor ya instaladas"
fi

# Instalar dependencias del cliente (incluyendo D3.js)
cd client
if [ ! -d "node_modules" ]; then
    echo "→ Instalando dependencias del cliente (incluyendo D3.js)..."
    npm install
else
    echo "→ Actualizando dependencias del cliente..."
    npm install
fi

cd ../..

echo ""
echo "✓ Todas las dependencias instaladas correctamente"
echo ""

# Verificar que los IDENTITY.md tienen las instrucciones JSON
echo "Verificando configuración de agentes..."
missing_json=0
for agent in ausencias bifurcaciones grounding neutralizacion; do
    if ! grep -q "json-grafo" "workspaces/$agent/IDENTITY.md"; then
        echo "⚠️  El agente $agent no tiene instrucciones JSON. Ejecuta el paso 1 de la integración."
        missing_json=1
    fi
done

if [ $missing_json -eq 0 ]; then
    echo "✓ Todos los agentes configurados correctamente"
else
    echo ""
    echo "⚠️  Algunos agentes necesitan actualización. Los archivos IDENTITY.md deben incluir"
    echo "   las instrucciones de output JSON estructurado."
fi

echo ""
echo "================================================"
echo "  Instalación completada"
echo "================================================"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Ejecutar un análisis:"
echo "   bash ejecutar_fase1.sh"
echo ""
echo "2. Iniciar el dashboard:"
echo "   Terminal 1: cd dashboard && npm start"
echo "   Terminal 2: cd dashboard/client && npm run dev"
echo ""
echo "3. Abrir el navegador en http://localhost:5173"
echo ""
echo "4. Ejecutar análisis desde la interfaz y ver el grafo en la pestaña GRAFO"
echo ""
echo "Para más información, consulta: ANALISIS_GRAFOS_CONOCIMIENTO.md"
echo ""
