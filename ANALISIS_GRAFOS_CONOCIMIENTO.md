# Sistema de Grafos de Conocimiento - TC2026

## Descripción

El sistema de grafos de conocimiento visualiza las relaciones entre los hallazgos de los 4 agentes críticos (Bifurcaciones, Grounding, Neutralización y Ausencias) que analizan el razonamiento interno de los LLMs.

## Arquitectura

### Flujo de Datos

```
Thinking del LLM
    ↓
4 Agentes (OpenClaw)
    ↓
JSON Estructurado (entidades + relaciones)
    ↓
Consolidación (grafo.json)
    ↓
Visualización D3.js (Dashboard React)
```

### Componentes

1. **Agentes Modificados** (`workspaces/*/IDENTITY.md`)
   - Cada agente produce análisis en Markdown + bloque JSON estructurado
   - JSON contiene entidades y relaciones específicas a su dominio

2. **Script de Consolidación** (`ejecutar_fase1.sh`)
   - Extrae bloques JSON de cada resultado
   - Consolida en un único `grafo.json` con metadata

3. **Componente de Visualización** (`dashboard/client/src/KnowledgeGraph.tsx`)
   - Renderiza grafo interactivo con D3.js
   - Permite zoom, pan, drag de nodos
   - Panel de detalles al hacer clic en nodos

4. **Endpoint del Servidor** (`dashboard/server/server.js`)
   - Sirve `grafo.json` en `/api/grafo`

## Estructura del JSON

```json
{
  "metadata": {
    "timestamp": "2026-04-03T10:52:00Z",
    "modelo": "claude-haiku-4-5-20251001",
    "provider": "anthropic"
  },
  "entidades": [
    {
      "id": "b1",
      "agente": "bifurcaciones",
      "tipo": "bifurcacion_descartada",
      "label": "Opción descartada: pedir clarificación",
      "fragmento": "...texto del thinking...",
      "descarte": "justificado|silencioso",
      "certeza": "alta|media|baja"
    }
  ],
  "relaciones": [
    {
      "desde": "b1",
      "hacia": "a1",
      "tipo": "sugiere_ausencia",
      "certeza": "alta|media|baja"
    }
  ]
}
```

## Tipos de Entidades por Agente

### Bifurcaciones
- **tipo**: `bifurcacion_descartada`
- **campos**: `fragmento`, `descarte` (justificado/silencioso)

### Grounding
- **tipo**: `omision_factual`, `generalizacion`, `fuente_fantasma`
- **campos**: `fragmento`, `omitido`, `reemplazado_por`

### Neutralización
- **tipo**: `auto_validacion`, `universalizacion`, `cierre_prematuro`
- **campos**: `fragmento`, `pregunta_clausurada`

### Ausencias
- **tipo**: `tematica`, `geopolitica`, `historica`, `epistemica`
- **campos**: `descripcion`

## Visualización

### Colores por Agente
- **Bifurcaciones**: Naranja (`#f59e0b`)
- **Grounding**: Verde (`#10b981`)
- **Neutralización**: Rojo (`#ef4444`)
- **Ausencias**: Púrpura (`#8b5cf6`)

### Representación de Certeza

**Nodos:**
- Alta: radio 12px
- Media: radio 10px
- Baja: radio 8px

**Aristas:**
- Alta: línea sólida gruesa (2px)
- Media: línea sólida delgada (1.5px)
- Baja: línea punteada (1px)

### Interacciones

- **Click en nodo**: Muestra panel de detalles con toda la información
- **Drag**: Mueve nodos manualmente
- **Zoom**: Rueda del mouse o pinch
- **Pan**: Click y arrastrar en el fondo

## Uso

### 1. Ejecutar Análisis

```bash
bash ejecutar_fase1.sh
```

Esto genera:
- `workspaces/*/RESULTADO_FASE1.md` (análisis individuales)
- `grafo.json` (grafo consolidado)

### 2. Visualizar en Dashboard

1. Iniciar servidor: `cd dashboard && npm start`
2. Iniciar cliente: `cd dashboard/client && npm run dev`
3. Ejecutar análisis desde la interfaz
4. Hacer clic en la pestaña "GRAFO"

### 3. Instalar Dependencias (primera vez)

```bash
cd dashboard/client
npm install
```

Esto instalará D3.js y sus tipos de TypeScript.

## Filosofía del Diseño

### Incertidumbre Explícita

El campo `certeza` en cada entidad y relación refleja que los hallazgos son interpretaciones, no verdades absolutas. El grafo no clausura el análisis, lo abre.

### Conexiones Provisionales

Las relaciones entre hallazgos son hipótesis sobre cómo los sesgos operan estructuralmente. Las líneas punteadas (certeza baja) indican conexiones especulativas.

### Ausencias como Nodos

Las ausencias detectadas por el Agente 4 son tan importantes como las presencias. El grafo las hace visibles y relacionables con otros hallazgos.

## Extensiones Futuras

### Fase 2: Procedencia Geopolítica
- Nodos adicionales para tradiciones jurídicas y corpus de entrenamiento
- Relaciones `procede_de` entre marcos y geografías

### Fase 3: Bibliografía Fantasma
- Nodos para citas implícitas
- Relaciones `cita_implicitamente` entre hallazgos y fuentes no mencionadas

### Detección Automática de Clusters
- Algoritmo Louvain para identificar grupos temáticos
- Visualización de comunidades con colores diferenciados

### Análisis Longitudinal
- Comparación de grafos entre múltiples sesiones
- Detección de patrones recurrentes en el mismo modelo

## Tecnologías

- **D3.js v7**: Visualización de grafos con force simulation
- **React 19**: Framework de UI
- **TypeScript**: Tipado estático
- **Node.js + Express**: Backend para servir datos
- **jq**: Procesamiento de JSON en bash

## Referencias

- [InfraNodus](https://infranodus.com/): Inspiración para detección de gaps
- [D3 Force Layout](https://d3js.org/d3-force): Documentación de simulación de fuerzas
- [TC2026 Original](traduccion_critica_TC2026.md): Fundamentos teóricos del proyecto
