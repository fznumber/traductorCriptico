# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Desarrollo y Comandos Comunes

### Iniciar el Proyecto
```bash
# 1. Configurar backend (una sola vez)
cd dashboard/server
npm install

# 2. Configurar frontend (una sola vez)
cd ../client
npm install

# 3. Iniciar desarrollo (en terminales separados)
# Terminal 1: Backend
cd dashboard/server
node server.js

# Terminal 2: Frontend
cd dashboard/client
npm run dev
```

### Comandos Útiles
- **Construir frontend para producción**: `cd dashboard/client && npm run build`
- **Vista previa de producción**: `cd dashboard/client && npm run preview`
- **Linting del frontend**: `cd dashboard/client && npm run lint`
- **Ejecutar orquestación completa**: `./ejecutar_fase1.sh` (desde raíz)
- **Probar conexión con ElevenLabs**: Revisar `.env` para API keys necesarias

### Requisitos Previos
- **Ollama** instalado y corriendo con modelo `qwen3.5:4b`: `ollama pull qwen3.5:4b`
- **Node.js** y **npm** instalados
- Variables de entorno en `.env` (ver `.env.example`)

## 🏗️ Arquitectura de Alto Nivel

### Flujo Principal (TC2026)
1. **Entrada**: Usuario ingresa un enunciado en el dashboard
2. **Thinking Inicial**: Backend genera cadena de pensamiento usando Ollama (`/api/generate-thinking`)
3. **Orquestación**: Script `ejecutar_fase1.sh` envía el thinking a 4 agentes especializados
4. **Análisis Paralelo**: Cada agente trabaja en su workspace (`workspaces/*/`)
5. **Resultados**: Dashboard muestra thinking inicial + resultados de los agentes (`/api/results`)
6. **Features Adicionales**: 
   - Música de fondo con ElevenLabs (`/api/generate-music`)
   - Text-to-Speech del thinking (`/api/speak-thinking`)
   - Speech-to-Text para entrada de voz (`/api/transcribe`)

### Estructura de Directorios
```
/dashboard
  /client        # React + TypeScript + Vite frontend
  /server        # Node.js/Express backend
  /public        # Assets estáticos
/workspaces
  /ausencias     # Agente de análisis de ausencias estructurales
  /bifurcaciones # Agente de análisis de bifurcaciones narrativas
  /grounding     # Agente de análisis de grounding/factualidad
  /neutralizacion # Agente de análisis de neutralización de sesgos
/prompts         # Directivas maestras para cada tipo de análisis
/tools           # Scripts auxiliares
thinking.txt     # Buffer compartido para el thinking actual
ejecutar_fase1.sh # Script principal de orquestación de agentes
```

### Agentes de Análisis (Workspaces)
Cada workspace contiene:
- `IDENTITY.md`: Definición de rol y enfoque de análisis
- `RESULTADO_FASE1.md`: Output generado después del análisis
- Archivos de soporte: AGENTS.md, TOOLS.md, USER.md, etc.

### Comunicación
- **Backend ↔ Frontend**: REST API en puerto 3001
- **Backend ↔ Ollama**: HTTP local para generación de thinking
- **Backend ↔ APIs externas**: ElevenLabs (audio), Anthropic (refinamiento de prompts)
- **Orquestación**: Bash script que llama a APIs usando curl/jq

## 🔧 Notas de Desarrollo

### Backend (dashboard/server/)
- `server.js`: Punto de entrada Express con todas las rutas API
- Variables de entorno críticas: `OLLAMA_URL`, `OLLAMA_MODEL`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`
- Uso de `node-fetch` para llamadas HTTP externas
- Manejo de streams para descarga de audio

### Frontend (dashboard/client/)
- Stack: React 19 + TypeScript + Vite
- Estado global probablemente manejado con Context API o similar
- Carpeta `public/audio/` para almacenar archivos MP3 generados

### Extensión y Mantenimiento
- Para agregar nuevos agentes: crear nuevo directorio en `/workspaces/` con estructura similar
- Para modificar análisis: editar `IDENTITY.md` del workspace correspondiente
- Para cambiar modelo LLM: actualizar `.env` (`OLLAMA_MODEL` o `ANTHROPIC_MODEL`)
- Los agentes responden exclusivamente en español según el mandato en `ejecutar_fase1.sh`

## 📱 Flujo de Trabajo Típico
1. Modificar prompts o identidades en `/prompts/` o `/workspaces/*/IDENTITY.md`
2. Probar cambios ejecutando `./ejecutar_fase1.sh` desde raíz
3. Ver resultados en dashboard bajo cada pestaña de agente
4. Ajustar basado en outputs en `workspaces/*/RESULTADO_FASE1.md`
5. Para cambios UI: modificar componentes en `dashboard/client/src/`
6. Para cambios API: editar `dashboard/server/server.js`