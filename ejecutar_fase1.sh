#!/bin/bash

# Script de ejecución de Fase 1 - TC2026 (Versión Robusta v3)
# Mandato de idioma español y optimización de estabilidad.

INPUT="thinking.txt"
INPUT_ABS=$(realpath "$INPUT")
ID_SUFFIX=$(date +%s)

if [ ! -f "$INPUT" ]; then
    echo "Error: No se encuentra el archivo $INPUT"
    exit 1
fi

echo "Iniciando análisis de Fase 1 (Mandato de Idioma: ESPAÑOL)..."
echo "-------------------------------------------------------"

# Función para ejecutar un agente usando curl directo a Ollama
ejecutar_agente() {
    local nombre=$1
    local path=$2
    local instructions=$(cat "$path/IDENTITY.md")
    
    echo ">> Analizando $nombre..."
    
    # Mensaje para el modelo
    local prompt_final="SISTEMA: Eres un experto en análisis crítico de modelos de lenguaje. 
    REGLA CRÍTICA: Responde EXCLUSIVAMENTE en ESPAÑOL y en formato Markdown.
    
    CONTEXTO DE TU IDENTIDAD:
    $instructions
    
    TAREA:
    Analiza el siguiente texto de 'Thinking' del LLM según tu identidad.
    
    TEXTO A ANALIZAR (Thinking):
    $(cat "$INPUT_ABS")"

    # Llamada directa a Ollama
    local response=$(curl -s -X POST http://127.0.0.1:11434/v1/chat/completions \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"qwen3.5:4b\",
            \"messages\": [{\"role\": \"user\", \"content\": $(echo "$prompt_final" | jq -Rs .)}],
            \"stream\": false
        }")

    # Extraer el contenido usando jq (probamos content y reasoning por si el modelo lo separa)
    local content=$(echo "$response" | jq -r '.choices[0].message.content // ""')
    local reasoning=$(echo "$response" | jq -r '.choices[0].message.reasoning // ""')

    if [ -n "$content" ] && [ "$content" != "null" ]; then
        echo "$content" > "$path/RESULTADO_FASE1.md"
        echo "   [OK] Guardado en $path/RESULTADO_FASE1.md"
    elif [ -n "$reasoning" ] && [ "$reasoning" != "null" ]; then
        echo "### Razonamiento Crítico (Thinking Extraído):" > "$path/RESULTADO_FASE1.md"
        echo "$reasoning" >> "$path/RESULTADO_FASE1.md"
        echo "   [OK] Guardado (desde reasoning) en $path/RESULTADO_FASE1.md"
    else
        echo "   [!] Error en $nombre. Respuesta vacía o formato desconocido."
        echo "Respuesta completa para depuración: $response" >> "$path/RESULTADO_FASE1.md"
    fi
}

# Ejecución secuencial de los 4 agentes
ejecutar_agente "BIFURCACIONES" "workspaces/bifurcaciones"
ejecutar_agente "GROUNDING" "workspaces/grounding"
ejecutar_agente "NEUTRALIZACIÓN" "workspaces/neutralizacion"
ejecutar_agente "AUSENCIAS" "workspaces/ausencias"

echo "-------------------------------------------------------"
echo "Proceso finalizado. Verifica los archivos RESULTADO_FASE1.md"
