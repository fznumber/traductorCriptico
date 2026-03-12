# Traductor Crítico (TC2026) 🦞

**TC2026** es una plataforma de auditoría diseñada para analizar la "subjetividad interna" de los Modelos de Lenguaje (LLMs). A diferencia de las herramientas que evalúan la respuesta final, TC2026 se enfoca en el proceso de razonamiento interno (*Thinking*) para detectar sesgos, bifurcaciones narrativas y ausencias estructurales.

## 🚀 Características

- **Análisis de Thinking:** Captura y audita el rastro de pensamiento de los LLMs antes de generar la respuesta final.
- **Arquitectura Multitarea:** Emplea 4 agentes especializados (Bifurcaciones, Grounding, Neutralización y Ausencias).
- **Inferencia Local:** Configurado para funcionar con **Ollama** (`qwen3.5:4b`) garantizando privacidad y soberanía técnica.
- **Dashboard Visual:** Interfaz moderna en React para orquestar el pipeline y visualizar resultados en tiempo real.

## 🛠️ Stack Tecnológico

- **IA:** [Ollama](https://ollama.com/) (Modelo `qwen3.5:4b`)
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js (Express)
- **Orquestación:** Scripts Bash + `curl`/`jq` para comunicación con la API de Ollama.

## 📂 Estructura del Proyecto

```text
├── dashboard/              # Interfaz web (Client & Server)
├── workspaces/             # Entornos de los 4 agentes de análisis
│   ├── ausencias/
│   ├── bifurcaciones/
│   ├── grounding/
│   └── neutralizacion/
├── prompts/                # Directivas maestras para cada análisis
├── ejecutar_fase1.sh       # Script principal de orquestación
└── thinking.txt            # Buffer del proceso de pensamiento actual
```

## ⚙️ Instalación y Configuración

### 1. Requisitos
- **Ollama** instalado y corriendo.
- Modelo `qwen3.5:4b` descargado: `ollama pull qwen3.5:4b`.
- **Node.js** y **npm** instalados.

### 2. Configurar el Backend
```bash
cd dashboard/server
npm install
node server.js
```

### 3. Configurar el Frontend
```bash
cd dashboard/client
npm install
npm run dev
```

## 🖥️ Uso

1. Abre el Dashboard en tu navegador.
2. Introduce un enunciado normativo o pregunta crítica.
3. El sistema generará el *Thinking* inicial usando Ollama.
4. El script `ejecutar_fase1.sh` se activará automáticamente, enviando el texto a los 4 agentes de análisis.
5. Los resultados aparecerán en el Dashboard y se guardarán en `workspaces/*/RESULTADO_FASE1.md`.

## 🧠 Filosofía
El *Thinking* de un LLM no es solo una ayuda para el razonamiento; es un documento de **auto-revelación involuntaria**. TC2026 "hackea" la narrativa de objetividad de los modelos para exponer las tensiones políticas y las decisiones ideológicas que ocurren milisegundos antes de que el modelo emita su respuesta "neutral".

---
*Proyecto desarrollado para la auditoría crítica de sistemas de IA.*
