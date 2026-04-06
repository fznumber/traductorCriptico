# Arquitectura y Flujo de Trabajo: TC2026 (Traducción Crítica)

Este documento detalla el funcionamiento técnico y conceptual del proyecto **TC2026**, diseñado para auditar la "subjetividad interna" de los Modelos de Lenguaje (LLMs) mediante el análisis de su proceso de razonamiento (*Thinking*).

---

## 1. El Stack Tecnológico

El proyecto se apoya en una infraestructura flexible que combina procesamiento local y APIs de alto rendimiento:

*   **Motores de Inferencia:** 
    *   **Local:** [Ollama](https://ollama.com/) (Modelo `qwen3.5:4b`).
    *   **Cloud Especializado:** [NVIDIA API / NIM](https://www.nvidia.com/en-us/ai-data-science/generative-ai/nim/) (Modelo `deepseek-ai/deepseek-r1`).
    *   **Análisis Externo:** [Anthropic API](https://www.anthropic.com/) (Claude 3.5/4.5).
*   **Orquestador de Agentes:** [OpenClaw](https://github.com/nethopper/openclaw)
    *   Utilizado para gestionar "Workspaces" independientes, cada uno con su propia identidad, memoria y configuración de modelo.
*   **Entorno de Ejecución:** Bash / Linux (Scripts de automatización y gestión de archivos Markdown).
*   **Protocolo de Comunicación:** CLI (Interfaz de Línea de Comandos) para la fase de procesamiento por lotes.

---

## 2. Flujo de Trabajo (Pipeline Crítico)

El proceso se divide en cuatro grandes etapas, desde la entrada del usuario hasta la generación del reporte crítico final.

### Paso 1: Generación del Material de Trabajo (*The Source*)
*   **Input:** El usuario introduce un enunciado normativo (Ej: *"El Estado garantiza seguridad"*).
*   **Proceso:** Un LLM primario genera una respuesta.
*   **Captura:** No nos interesa la respuesta final, sino el **proceso de pensamiento interno** generado por el modelo. Este texto se guarda en `thinking.txt`.

### Paso 2: Orquestación de la Fase 1 (*Análisis de Internals*)
El script `ejecutar_fase1.sh` activa 4 agentes especializados de **OpenClaw** que operan en paralelo sobre el mismo archivo `thinking.txt`:

1.  **Agente de BIFURCACIONES:** Localiza los "caminos no tomados". Qué opciones de respuesta el modelo consideró y decidió descartar antes de hablar.
2.  **Agente de GROUNDING:** Rastrea qué marcos legales, geopolíticos o ideológicos activó el modelo internamente (aunque luego los haya generalizado).
3.  **Agente de NEUTRALIZACIÓN:** Identifica los gestos de "autocorrección ética" donde el modelo fuerza una apariencia de neutralidad.
4.  **Agente de AUSENCIAS:** Mapea lo que el modelo **ni siquiera llegó a pensar** (el silencio estructural del corpus de entrenamiento).

### Paso 3: Consolidación de Resultados
*   Cada agente genera un archivo `RESULTADO_FASE1.md` en su respectivo subdirectorio de `workspaces/`.
*   Estos archivos contienen citas textuales del *thinking* original contrastadas con el análisis crítico del agente.

### Paso 4: Transición a Fases 2 y 3 (Hacia la Revelación)
*   **Fase 2 (Investigación):** Los hallazgos de la Fase 1 se usan como consultas para repositorios externos (archivos históricos, prensa crítica, literatura).
*   **Fase 3 (Instalación/Revelación):** Se contrastan las "Zonas de Opacidad" detectadas en el *thinking* con las realidades materiales encontradas en la investigación externa.

---

## 3. Estructura de un Workspace (Agente)

Cada módulo de análisis en `workspaces/` es un entorno autónomo definido por:

*   `IDENTITY.md` / `SOUL.md`: El "System Prompt" que define la lente crítica del agente.
*   `AGENTS.md`: La configuración técnica (Modelo `qwen3.5:27b`, parámetros de temperatura, etc.).
*   `memory/`: Almacenamiento de contexto para análisis persistentes.

---

## 4. Filosofía Técnica: El Pensamiento como Evidencia

En **TC2026**, el *Thinking* de un LLM no es visto como una herramienta de transparencia para el usuario, sino como un **documento de auto-revelación involuntaria**. La arquitectura técnica está diseñada para "hackear" la narrativa de objetividad de los modelos, exponiendo las tensiones y decisiones políticas que ocurren en el milisegundo previo a la generación de la respuesta.
