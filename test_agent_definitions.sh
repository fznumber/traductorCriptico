#!/bin/bash

# Script de prueba para el sistema de definiciones de agentes

API_BASE="http://localhost:3001/api"
SESSION_ID=1

echo "=== TEST: Sistema de Definiciones de Agentes ==="
echo ""

# 1. Obtener definiciones por defecto
echo "1. Obteniendo definiciones por defecto..."
curl -s "$API_BASE/default-agent-definitions" | jq 'keys'
echo ""

# 2. Obtener definiciones para sesión 1 (debería usar defaults)
echo "2. Obteniendo definiciones para sesión $SESSION_ID..."
curl -s "$API_BASE/agent-definitions/$SESSION_ID" | jq 'keys'
echo ""

# 3. Ver definición específica de bifurcaciones
echo "3. Definición de bifurcaciones (primeras 200 chars)..."
curl -s "$API_BASE/agent-definitions/$SESSION_ID/bifurcaciones" | jq -r '.definition' | head -c 200
echo "..."
echo ""

# 4. Personalizar definición de bifurcaciones
echo "4. Personalizando definición de bifurcaciones..."
CUSTOM_DEF="# IDENTITY.md - Analizador de Bifurcaciones PERSONALIZADO

Sos un analizador MODIFICADO de procesos de decisión en modelos de lenguaje.

Esta es una versión personalizada para testing.

Tu tarea es identificar bifurcaciones con mayor énfasis en decisiones políticas."

curl -s -X POST "$API_BASE/agent-definitions/$SESSION_ID/bifurcaciones" \
  -H "Content-Type: application/json" \
  -d "{\"definition\": $(echo "$CUSTOM_DEF" | jq -Rs .)}" | jq '.'
echo ""

# 5. Verificar que la personalización se guardó
echo "5. Verificando personalización (primeras 200 chars)..."
curl -s "$API_BASE/agent-definitions/$SESSION_ID/bifurcaciones" | jq -r '.definition' | head -c 200
echo "..."
echo ""

# 6. Verificar en BD directamente
echo "6. Verificando en BD..."
sqlite3 dashboard/server/tc2026.db "SELECT session_id, agent_name, LENGTH(definition) as len FROM agent_definitions WHERE session_id = $SESSION_ID;"
echo ""

# 7. Resetear a default
echo "7. Reseteando a definición por defecto..."
curl -s -X DELETE "$API_BASE/agent-definitions/$SESSION_ID/bifurcaciones" | jq '.'
echo ""

# 8. Verificar que volvió al default
echo "8. Verificando que volvió al default (primeras 200 chars)..."
curl -s "$API_BASE/agent-definitions/$SESSION_ID/bifurcaciones" | jq -r '.definition' | head -c 200
echo "..."
echo ""

echo "=== TEST COMPLETADO ==="
