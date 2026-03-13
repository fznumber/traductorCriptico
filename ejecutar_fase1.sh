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

# Cargar variables de entorno desde .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Valores por defecto
PROVIDER=${LLM_PROVIDER:-ollama}

echo "Iniciando análisis de Fase 1 (Mandato de Idioma: ESPAÑOL)..."
echo "Usando Proveedor: $PROVIDER"
echo "-------------------------------------------------------"

# Función para ejecutar un agente usando el proveedor configurado
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

    # Intentar hasta 2 veces por agente
    local max_retries=2
    local attempt=1
    local success=false

    while [ $attempt -le $max_retries ] && [ "$success" = false ]; do
        echo "   [Intento $attempt] Llamando a la API..."

        if [ "$PROVIDER" == "anthropic" ]; then
            response=$(curl -s -X POST https://api.anthropic.com/v1/messages \
                -H "Content-Type: application/json" \
                -H "x-api-key: $ANTHROPIC_API_KEY" \
                -H "anthropic-version: 2023-06-01" \
                -d "{
                    \"model\": \"${ANTHROPIC_MODEL:-claude-3-5-sonnet-20241022}\",
                    \"max_tokens\": 4096,
                    \"messages\": [{\"role\": \"user\", \"content\": $(echo "$prompt_final" | jq -Rs .)}]
                }")
            content=$(echo "$response" | jq -r '.content[0].text // ""')
        else
            response=$(curl -s -X POST ${OLLAMA_URL:-http://127.0.0.1:11434/v1/chat/completions} \
                -H "Content-Type: application/json" \
                -d "{
                    \"model\": \"${OLLAMA_MODEL:-qwen3.5:4b}\",
                    \"messages\": [{\"role\": \"user\", \"content\": $(echo "$prompt_final" | jq -Rs .)}],
                    \"stream\": false
                }")
            content=$(echo "$response" | jq -r '.choices[0].message.content // ""')
            local reasoning=$(echo "$response" | jq -r '.choices[0].message.reasoning // ""')
            if [ -z "$content" ] && [ -n "$reasoning" ] && [ "$reasoning" != "null" ]; then
                content="### Razonamiento Crítico (Thinking Extraído):\n$reasoning"
            fi
        fi

        if [ -n "$content" ] && [ "$content" != "null" ] && [ "$content" != "" ]; then
            echo -e "$content" > "$path/RESULTADO_FASE1.md"
            echo "   [OK] Guardado en $path/RESULTADO_FASE1.md"
            success=true
        else
            echo "   [!] Intento $attempt fallido. Respuesta: $response"
            ((attempt++))
            sleep 2
        fi
    done

    if [ "$success" = false ]; then
        echo "### ERROR DE ANÁLISIS\nNo se pudo obtener respuesta del modelo después de $max_retries intentos.\n\nRespuesta técnica: $response" > "$path/RESULTADO_FASE1.md"
        echo "   [!] AGENTE FALLIDO: Se guardó informe de error en $path/RESULTADO_FASE1.md"
    fi
    }

# Ejecución secuencial de los 4 agentes
ejecutar_agente "BIFURCACIONES" "workspaces/bifurcaciones"
ejecutar_agente "GROUNDING" "workspaces/grounding"
ejecutar_agente "NEUTRALIZACIÓN" "workspaces/neutralizacion"
ejecutar_agente "AUSENCIAS" "workspaces/ausencias"

echo "-------------------------------------------------------"
echo "Proceso finalizado. Verifica los archivos RESULTADO_FASE1.md"
