# Traductor Crítico (TC2026) 🦞

**TC2026** es una plataforma de auditoría diseñada para analizar la "subjetividad interna" de los Modelos de Lenguaje (LLMs). A diferencia de las herramientas que evalúan la respuesta final, TC2026 se enfoca en el proceso de razonamiento interno (*Thinking*) para detectar sesgos, bifurcaciones narrativas y ausencias estructurales.

## 🚀 Características

- **Análisis de Thinking:** Captura y audita el rastro de pensamiento de los LLMs antes de generar la respuesta final.
- **Arquitectura Multitarea:** Emplea 4 agentes especializados (Bifurcaciones, Grounding, Neutralización y Ausencias).
- **Grafos de Conocimiento:** Visualización interactiva con D3.js que muestra las relaciones entre hallazgos de los agentes.
- **Inferencia Local:** Configurado para funcionar con **Ollama** (`qwen3.5:4b`) garantizando privacidad y soberanía técnica.
- **Dashboard Visual:** Interfaz moderna en React para orquestar el pipeline y visualizar resultados en tiempo real.

## 🛠️ Stack Tecnológico

- **IA:** [Ollama](https://ollama.com/) (Modelo `qwen3.5:4b`)
- **Frontend:** React + TypeScript + Vite + D3.js
- **Backend:** Node.js (Express)
- **Orquestación:** Scripts Bash + `curl`/`jq` para comunicación con la API de Ollama.

## 📂 Estructura del Proyecto

```text
├── dashboard/              # Interfaz web (Client & Server)
│   ├── client/
│   │   └── src/
│   │       ├── App.tsx           # Componente principal
│   │       └── KnowledgeGraph.tsx # Visualización de grafos
│   └── server/
│       └── server.js       # API REST
├── workspaces/             # Entornos de los 4 agentes de análisis
│   ├── ausencias/
│   ├── bifurcaciones/
│   ├── grounding/
│   └── neutralizacion/
├── prompts/                # Directivas maestras para cada análisis
├── ejecutar_fase1.sh       # Script principal de orquestación
├── setup_grafos.sh         # Script de instalación del sistema de grafos
├── grafo.json              # Grafo consolidado (generado automáticamente)
├── thinking.txt            # Buffer del proceso de pensamiento actual
└── ANALISIS_GRAFOS_CONOCIMIENTO.md  # Documentación del sistema de grafos
```

## ⚙️ Instalación y Configuración

### 1. Requisitos
- **Ollama** instalado y corriendo.
- Modelo `qwen3.5:4b` descargado: `ollama pull qwen3.5:4b`.
- **Node.js** y **npm** instalados.
- **jq** instalado (para procesamiento de JSON): `sudo apt-get install jq` (Linux) o `brew install jq` (macOS).

### 2. Instalación Rápida (Sistema de Grafos incluido)
```bash
bash setup_grafos.sh
```

Este script instalará todas las dependencias necesarias, incluyendo D3.js para la visualización de grafos.

### 3. Configuración Manual

#### Backend
```bash
cd dashboard
npm install
npm start
```

#### Frontend
```bash
cd dashboard/client
npm install
npm run dev
```

## 🖥️ Uso

1. Abre el Dashboard en tu navegador (por defecto: `http://localhost:5173`).
2. Introduce un enunciado normativo o pregunta crítica.
3. El sistema generará el *Thinking* inicial usando Ollama.
4. El script `ejecutar_fase1.sh` se activará automáticamente, enviando el texto a los 4 agentes de análisis.
5. Los resultados aparecerán en el Dashboard:
   - **Pestañas individuales:** Análisis de cada agente en Markdown
   - **Pestaña GRAFO:** Visualización interactiva de las relaciones entre hallazgos
6. Los resultados se guardan en:
   - `workspaces/*/RESULTADO_FASE1.md` (análisis individuales)
   - `grafo.json` (grafo consolidado)

### Interacción con el Grafo

- **Zoom:** Rueda del mouse o pinch
- **Pan:** Click y arrastrar en el fondo
- **Mover nodos:** Arrastrar nodos individuales
- **Ver detalles:** Click en cualquier nodo para ver información completa
- **Colores:** Cada agente tiene un color distintivo (Bifurcaciones: naranja, Grounding: verde, Neutralización: rojo, Ausencias: púrpura)
- **Certeza:** El tamaño de los nodos y el estilo de las líneas indican el nivel de certeza (alta/media/baja)

Para más información sobre el sistema de grafos, consulta [ANALISIS_GRAFOS_CONOCIMIENTO.md](ANALISIS_GRAFOS_CONOCIMIENTO.md).

## 🧠 Filosofía
El *Thinking* de un LLM no es solo una ayuda para el razonamiento; es un documento de **auto-revelación involuntaria**. TC2026 "hackea" la narrativa de objetividad de los modelos para exponer las tensiones políticas y las decisiones ideológicas que ocurren milisegundos antes de que el modelo emita su respuesta "neutral".

---
*Proyecto desarrollado para la auditoría crítica de sistemas de IA.*
