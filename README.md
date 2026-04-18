# TC2026 - Sistema de Análisis Crítico de Enunciados Normativos

Sistema multiagente para análisis crítico de enunciados normativos en 3 fases, con generación de música ambiente y síntesis de voz.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **Python** 3.8 o superior (para Ollama/uvx)
- **Ollama** instalado y corriendo (para thinking local)
- **API Keys**:
  - Anthropic (Claude) - Para agentes
  - ElevenLabs - Para música y voz
  - NVIDIA (opcional) - Para thinking alternativo

## 🚀 Instalación Inicial

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd <nombre-proyecto>
```

### 2. Instalar Ollama (si usarás thinking local)
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama

# Windows
# Descargar desde https://ollama.com/download
```

### 3. Descargar modelo de Ollama
```bash
ollama pull qwen3.5:4b
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

Edita `.env` con tus API keys:
```bash
# THINKING PROVIDER
THINKING_PROVIDER=ollama  # o 'nvidia'

# OLLAMA (si usas thinking local)
OLLAMA_URL=http://localhost:11434/v1/chat/completions
OLLAMA_MODEL=qwen3.5:4b

# ANTHROPIC (requerido para agentes)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# NVIDIA (opcional, solo si THINKING_PROVIDER=nvidia)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxx
NVIDIA_MODEL=deepseek-ai/deepseek-v3.2
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# ELEVENLABS (requerido para música y voz)
ELEVENLABS_API_KEY=xxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### 5. Instalar dependencias del backend
```bash
cd dashboard/server
npm install
```

### 6. Instalar dependencias del frontend
```bash
cd ../client
npm install
```

### 7. Inicializar base de datos

La base de datos SQLite se crea automáticamente al iniciar el servidor por primera vez.

## ▶️ Ejecutar el Proyecto

### Opción 1: Ejecutar manualmente (desarrollo)

**Terminal 1 - Backend:**
```bash
cd dashboard/server
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd dashboard/client
npm run dev
```

### Opción 2: Script de inicio (producción)

Crear un script `start.sh`:
```bash
#!/bin/bash

# Iniciar Ollama (si no está corriendo)
ollama serve &

# Iniciar backend
cd dashboard/server
node server.js &

# Iniciar frontend
cd ../client
npm run dev
```

Dar permisos y ejecutar:
```bash
chmod +x start.sh
./start.sh
```

## 🌐 Acceder a la Aplicación

Una vez iniciado, abre tu navegador en:
```
http://localhost:5173
```

El backend corre en:
```
http://localhost:3001
```

## 👤 Primer Uso

1. **Seleccionar usuario**: Al abrir la aplicación, selecciona o crea un usuario (Diego, Claudia, Ariel, Invitado)

2. **Configurar audio** (opcional):
   - Abre el panel de configuración (icono de engranaje)
   - Configura dispositivos de salida de audio
   - Personaliza el template de música

3. **Ejecutar primer análisis**:
   - Escribe un enunciado normativo (ej: "El Estado garantiza la seguridad ciudadana")
   - Haz click en "ANALIZAR"
   - Espera a que se complete la Fase 1
   - Opcionalmente ejecuta Fase 2 y Fase 3

## 📁 Estructura del Proyecto

```
.
├── dashboard/
│   ├── server/              # Backend (Node.js + Express)
│   │   ├── server.js        # Servidor principal
│   │   ├── db.js            # Configuración de base de datos
│   │   ├── tc2026.db        # Base de datos SQLite (se crea automáticamente)
│   │   └── package.json
│   └── client/              # Frontend (React + TypeScript + Vite)
│       ├── src/
│       │   └── App.tsx      # Componente principal
│       ├── public/
│       │   └── audio/       # Archivos de audio generados
│       └── package.json
├── workspaces/              # Definiciones de agentes
│   ├── ausencias/
│   ├── bifurcaciones/
│   ├── grounding/
│   ├── neutralizacion/
│   ├── rag_dirigido/
│   ├── procedencia_marcos/
│   ├── cambio_semantico/
│   ├── patrones_contrastivos/
│   ├── fuentes_activadas/
│   ├── opacidad_residual/
│   ├── sensibilidad_contextual/
│   └── vigencia_provisional/
├── .env                     # Variables de entorno (crear desde .env.example)
├── .env.example             # Plantilla de variables de entorno
└── README.md                # Este archivo
```

## 🔧 Configuración Avanzada

### Cambiar Provider de Thinking

En `.env`:
```bash
# Usar Ollama (local, gratis)
THINKING_PROVIDER=ollama

# O usar NVIDIA (cloud, requiere API key)
THINKING_PROVIDER=nvidia
```

### Cambiar Voz de Text-to-Speech

Encuentra voces en: https://elevenlabs.io/voice-library

En `.env`:
```bash
ELEVENLABS_VOICE_ID=tu_voice_id_aqui
```

### Personalizar Agentes

1. Ve al panel de configuración (icono de engranaje)
2. Haz click en "Ver" junto al agente que quieres personalizar
3. Edita las instrucciones
4. Guarda los cambios

Las personalizaciones se guardan por sesión.

## 🗄️ Base de Datos

La base de datos SQLite (`tc2026.db`) contiene:

- **users**: Usuarios del sistema
- **sessions**: Sesiones de análisis
- **agent_logs**: Resultados de agentes
- **audio_config**: Configuración de audio por sesión
- **agent_definitions**: Definiciones personalizadas de agentes
- **default_agent_definitions**: Definiciones por defecto

### Resetear Base de Datos

Si necesitas empezar desde cero:
```bash
cd dashboard/server
rm tc2026.db
node server.js  # Se creará nueva BD automáticamente
```

## 🐛 Solución de Problemas

### Error: "API Key missing"
- Verifica que `.env` existe y tiene las API keys correctas
- Reinicia el servidor después de editar `.env`

### Error: "Ollama connection refused"
- Verifica que Ollama está corriendo: `ollama serve`
- Verifica la URL en `.env`: `OLLAMA_URL=http://localhost:11434/v1/chat/completions`

### Error: "Port 3001 already in use"
- Detén el proceso anterior: `pkill -f "node server.js"`
- O cambia el puerto en `server.js`

### No se genera música
- Verifica que `ELEVENLABS_API_KEY` es válida
- Verifica que tienes créditos en tu cuenta de ElevenLabs
- Revisa los logs del servidor para ver errores específicos

### Agentes no se ejecutan
- Verifica que `ANTHROPIC_API_KEY` es válida
- Verifica que el thinking se completó antes de ejecutar Fase 1
- Revisa los logs del servidor

## 📊 Monitoreo

### Ver logs del servidor
```bash
cd dashboard/server
node server.js
# Los logs aparecerán en la consola
```

### Ver logs del frontend
Abre DevTools del navegador (F12) y ve a la pestaña "Console"

### Ver base de datos
```bash
cd dashboard/server
sqlite3 tc2026.db

# Comandos útiles:
.tables                    # Ver todas las tablas
SELECT * FROM sessions;    # Ver sesiones
SELECT * FROM agent_logs;  # Ver resultados de agentes
.quit                      # Salir
```

## 🔐 Seguridad

- **NO** subas el archivo `.env` al repositorio
- **NO** compartas tus API keys
- Usa `.gitignore` para excluir archivos sensibles
- Considera usar variables de entorno del sistema en producción

## 📝 Documentación Adicional

- `ARQUITECTURA_FLUJO_TC2026.md` - Arquitectura del sistema
- `IMPLEMENTACION_FASE2.md` - Detalles de Fase 2
- `IMPLEMENTACION_FASE3.md` - Detalles de Fase 3
- `CORRECCION_SESIONES_REUTILIZACION.md` - Manejo de sesiones
- `IMPLEMENTACION_SPEAK_THINKING.md` - Text-to-Speech
- `DEBUG_TEMPLATE_MUSICA.md` - Debug de música

## 🤝 Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Haz commit de tus cambios: `git commit -am 'Agregar nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

## 📄 Licencia

[Especificar licencia]

## 👥 Autores

[Especificar autores]

## 🙏 Agradecimientos

- Anthropic (Claude API)
- ElevenLabs (Audio API)
- Ollama (Local LLM)
- NVIDIA (Cloud LLM)
