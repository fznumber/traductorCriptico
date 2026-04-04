#!/bin/bash

# Script de prueba rápida del sistema de grafos

echo "================================================"
echo "  TC2026 - Test del Sistema de Grafos"
echo "================================================"
echo ""

# Verificar que existe el grafo de ejemplo
if [ ! -f "grafo_ejemplo.json" ]; then
    echo "❌ Error: No se encuentra grafo_ejemplo.json"
    exit 1
fi

echo "✓ Archivo de ejemplo encontrado"
echo ""

# Copiar el ejemplo como grafo.json para testing
cp grafo_ejemplo.json grafo.json
echo "✓ Grafo de ejemplo copiado a grafo.json"
echo ""

# Verificar que el JSON es válido
if jq empty grafo.json 2>/dev/null; then
    echo "✓ JSON válido"
else
    echo "❌ Error: JSON inválido"
    exit 1
fi

echo ""
echo "Estadísticas del grafo de ejemplo:"
echo "-----------------------------------"

# Contar entidades por agente
echo "Entidades por agente:"
jq -r '.entidades | group_by(.agente) | .[] | "\(.length) - \(.[0].agente)"' grafo.json

echo ""
echo "Total de entidades: $(jq '.entidades | length' grafo.json)"
echo "Total de relaciones: $(jq '.relaciones | length' grafo.json)"

echo ""
echo "Tipos de relaciones:"
jq -r '.relaciones | group_by(.tipo) | .[] | "\(.length) - \(.[0].tipo)"' grafo.json

echo ""
echo "Distribución de certeza (entidades):"
jq -r '.entidades | group_by(.certeza) | .[] | "\(.length) - \(.[0].certeza)"' grafo.json

echo ""
echo "================================================"
echo "  Test completado"
echo "================================================"
echo ""
echo "Para visualizar este grafo:"
echo "1. Inicia el servidor: cd dashboard && npm start"
echo "2. Inicia el cliente: cd dashboard/client && npm run dev"
echo "3. Abre http://localhost:5173"
echo "4. El grafo estará disponible en la pestaña GRAFO"
echo ""
echo "Nota: Este es un grafo de ejemplo. Para generar uno real,"
echo "ejecuta: bash ejecutar_fase1.sh"
echo ""
