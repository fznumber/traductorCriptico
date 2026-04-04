# Arquitectura del Sistema de Grafos de Conocimiento

## Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (Dashboard React)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Introduce enunciado
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GENERACIÓN DE THINKING                        │
│                    (Ollama / Claude API)                         │
│                                                                  │
│  Input: "El Estado garantiza seguridad"                         │
│  Output: thinking.txt (razonamiento interno del LLM)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 2. thinking.txt generado
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ORQUESTACIÓN DE AGENTES                        │
│                   (ejecutar_fase1.sh)                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Bifurcaciones│  │  Grounding   │  │Neutralización│          │
│  │   (Claude)   │  │   (Claude)   │  │   (Claude)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │              Ausencias (Claude)                     │         │
│  └──────────────────────┬──────────────────────────────┘         │
│                         │                                        │
│                         │ 3. Cada agente produce:                │
│                         │    - Análisis en Markdown              │
│                         │    - Bloque JSON estructurado          │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  workspaces/*/RESULTADO_FASE1.md                    │        │
│  │                                                      │        │
│  │  # Análisis de Bifurcaciones                        │        │
│  │  ...texto en Markdown...                            │        │
│  │                                                      │        │
│  │  ```json-grafo                                      │        │
│  │  {                                                  │        │
│  │    "entidades": [...],                              │        │
│  │    "relaciones": [...]                              │        │
│  │  }                                                  │        │
│  │  ```                                                │        │
│  └──────────────────────┬──────────────────────────────┘        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │ 4. Extracción y consolidación
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CONSOLIDACIÓN DE JSON                           │
│                  (bash + jq)                                     │
│                                                                  │
│  for agent in ausencias bifurcaciones grounding neutralizacion  │
│    extract JSON from RESULTADO_FASE1.md                         │
│    validate with jq                                             │
│  done                                                            │
│                                                                  │
│  jq -n --argjson bif ... --argjson gro ... '{                   │
│    metadata: {...},                                             │
│    entidades: ($bif.entidades + $gro.entidades + ...),         │
│    relaciones: ($bif.relaciones + $gro.relaciones + ...)       │
│  }' > grafo.json                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 5. grafo.json generado
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVIDOR EXPRESS                            │
│                   (dashboard/server/server.js)                   │
│                                                                  │
│  GET /api/grafo                                                 │
│    ├─ if exists(grafo.json)                                     │
│    │    return sendFile(grafo.json)                             │
│    └─ else                                                      │
│         return 404 "Grafo no disponible"                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 6. HTTP GET /api/grafo
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENTE REACT                               │
│              (KnowledgeGraph.tsx)                                │
│                                                                  │
│  useEffect(() => {                                              │
│    fetch(grafoUrl)                                              │
│      .then(res => res.json())                                   │
│      .then(data => setGrafoData(data))                          │
│  }, [grafoUrl])                                                 │
│                                                                  │
│  useEffect(() => {                                              │
│    if (!grafoData) return;                                      │
│    renderD3Graph(grafoData);                                    │
│  }, [grafoData])                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 7. Renderizado D3.js
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VISUALIZACIÓN D3                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │                                                     │         │
│  │   ●─────────●                                      │         │
│  │   │ b1      │ a1                                   │         │
│  │   │         │                                      │         │
│  │   ●─────────●─────────●                            │         │
│  │     g1              n1                             │         │
│  │                                                     │         │
│  │  Leyenda:                                          │         │
│  │  ● Bifurcaciones (naranja)                         │         │
│  │  ● Grounding (verde)                               │         │
│  │  ● Neutralización (rojo)                           │         │
│  │  ● Ausencias (púrpura)                             │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  Interacciones:                                                 │
│  - Zoom (rueda del mouse)                                       │
│  - Pan (arrastrar fondo)                                        │
│  - Drag nodos                                                   │
│  - Click → Panel de detalles                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React + TypeScript)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                    App.tsx                            │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────┐         │       │
│  │  │  Estado:                                │         │       │
│  │  │  - prompt                               │         │       │
│  │  │  - status                               │         │       │
│  │  │  - results                              │         │       │
│  │  │  - activeTab                            │         │       │
│  │  │  - grafoUrl ◄─────────────────────┐    │         │       │
│  │  └─────────────────────────────────────────┘         │       │
│  │                                              │        │       │
│  │  ┌─────────────────────────────────────────┐│        │       │
│  │  │  Tabs:                                  ││        │       │
│  │  │  - THINKING                             ││        │       │
│  │  │  - AUSENCIAS                            ││        │       │
│  │  │  - BIFURCACIONES                        ││        │       │
│  │  │  - GROUNDING                            ││        │       │
│  │  │  - NEUTRALIZACIÓN                       ││        │       │
│  │  │  - GRAFO ◄──────────────────────────────┼┘        │       │
│  │  └─────────────────────────────────────────┘         │       │
│  │                                              │        │       │
│  │  {activeTab === 'grafo' && grafoUrl && (    │        │       │
│  │    <KnowledgeGraph grafoUrl={grafoUrl} />   │        │       │
│  │  )}                                          │        │       │
│  └──────────────────────┬───────────────────────┘        │       │
│                         │                                │       │
│                         ▼                                │       │
│  ┌──────────────────────────────────────────────────────┐│       │
│  │           KnowledgeGraph.tsx                         ││       │
│  │                                                      ││       │
│  │  Props: { grafoUrl: string }                        ││       │
│  │                                                      ││       │
│  │  Estado:                                            ││       │
│  │  - grafoData: GrafoData | null                      ││       │
│  │  - selectedNode: Entidad | null                     ││       │
│  │  - error: string | null                             ││       │
│  │                                                      ││       │
│  │  ┌────────────────────────────────────────┐         ││       │
│  │  │  useEffect: Fetch grafo                │         ││       │
│  │  │    fetch(grafoUrl)                     │         ││       │
│  │  │      .then(setGrafoData)               │         ││       │
│  │  └────────────────────────────────────────┘         ││       │
│  │                                                      ││       │
│  │  ┌────────────────────────────────────────┐         ││       │
│  │  │  useEffect: Render D3                  │         ││       │
│  │  │    d3.select(svgRef.current)           │         ││       │
│  │  │      .append('g')                       │         ││       │
│  │  │      .selectAll('circle')               │         ││       │
│  │  │      .data(nodes)                       │         ││       │
│  │  │      ...                                │         ││       │
│  │  └────────────────────────────────────────┘         ││       │
│  │                                                      ││       │
│  │  Render:                                            ││       │
│  │  - <svg ref={svgRef} />                             ││       │
│  │  - {selectedNode && <DetailPanel />}                ││       │
│  │  - <Legend />                                       ││       │
│  └──────────────────────────────────────────────────────┘│       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    (Node.js + Express)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              server.js                                │       │
│  │                                                       │       │
│  │  POST /api/generate-thinking                         │       │
│  │    ├─ Call Ollama API                                │       │
│  │    └─ Save to thinking.txt                           │       │
│  │                                                       │       │
│  │  POST /api/run-phase-1                               │       │
│  │    ├─ exec('bash ejecutar_fase1.sh')                 │       │
│  │    └─ Return immediately (async)                     │       │
│  │                                                       │       │
│  │  GET /api/results                                    │       │
│  │    ├─ Read thinking.txt                              │       │
│  │    ├─ Read workspaces/*/RESULTADO_FASE1.md          │       │
│  │    └─ Return JSON                                    │       │
│  │                                                       │       │
│  │  GET /api/grafo ◄─────────────────────────────┐      │       │
│  │    ├─ if exists(grafo.json)                   │      │       │
│  │    │    sendFile(grafo.json)                  │      │       │
│  │    └─ else                                    │      │       │
│  │         return 404                            │      │       │
│  └───────────────────────────────────────────────┘      │       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ORQUESTACIÓN                                  │
│                  (Bash Scripts)                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           ejecutar_fase1.sh                           │       │
│  │                                                       │       │
│  │  1. Load .env                                        │       │
│  │  2. For each agent:                                  │       │
│  │       - Build prompt with IDENTITY.md                │       │
│  │       - Call LLM API (Anthropic/Ollama)              │       │
│  │       - Save to RESULTADO_FASE1.md                   │       │
│  │  3. Extract JSON blocks:                             │       │
│  │       - sed -n '/```json-grafo/,/```/p'              │       │
│  │       - sed '1d;$d' (remove delimiters)              │       │
│  │  4. Consolidate with jq:                             │       │
│  │       - jq -n --argjson bif ... '{...}'              │       │
│  │       - Output to grafo.json                         │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

```
┌──────────────┐
│   Usuario    │
└──────┬───────┘
       │ Introduce enunciado
       ▼
┌──────────────────────────────────────────────────────────┐
│                    thinking.txt                          │
│  "Consideré varias opciones... decidí que..."           │
└──────┬───────────────────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬─────────────────┐
       ▼                 ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Bifurcaciones│  │  Grounding  │  │Neutralización│  │  Ausencias  │
│   Agente    │  │   Agente    │  │   Agente    │  │   Agente    │
└─────┬───────┘  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘
      │                │                │                │
      │ Markdown+JSON  │ Markdown+JSON  │ Markdown+JSON  │ Markdown+JSON
      ▼                ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│RESULTADO_   │  │RESULTADO_   │  │RESULTADO_   │  │RESULTADO_   │
│FASE1.md     │  │FASE1.md     │  │FASE1.md     │  │FASE1.md     │
│             │  │             │  │             │  │             │
│```json-grafo│  │```json-grafo│  │```json-grafo│  │```json-grafo│
│{...}        │  │{...}        │  │{...}        │  │{...}        │
│```          │  │```          │  │```          │  │```          │
└─────┬───────┘  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘
      │                │                │                │
      └────────────────┴────────────────┴────────────────┘
                       │
                       │ jq consolidation
                       ▼
              ┌─────────────────┐
              │   grafo.json    │
              │                 │
              │ {               │
              │   metadata: {}, │
              │   entidades: [],│
              │   relaciones: []│
              │ }               │
              └────────┬────────┘
                       │
                       │ HTTP GET
                       ▼
              ┌─────────────────┐
              │ KnowledgeGraph  │
              │   Component     │
              └────────┬────────┘
                       │
                       │ D3.js render
                       ▼
              ┌─────────────────┐
              │  Visualización  │
              │     Grafo       │
              │                 │
              │   ●─────●       │
              │   │     │       │
              │   ●─────●       │
              └─────────────────┘
```

## Estructura de Archivos

```
traductorCriptico/
│
├── dashboard/
│   ├── server/
│   │   └── server.js ◄────────────── Endpoint /api/grafo
│   │
│   └── client/
│       ├── src/
│       │   ├── App.tsx ◄──────────── Integración del grafo
│       │   └── KnowledgeGraph.tsx ◄─ Componente D3
│       │
│       └── package.json ◄──────────── Dependencia: d3
│
├── workspaces/
│   ├── ausencias/
│   │   ├── IDENTITY.md ◄──────────── Prompt + instrucciones JSON
│   │   └── RESULTADO_FASE1.md ◄───── Output: Markdown + JSON
│   │
│   ├── bifurcaciones/
│   │   ├── IDENTITY.md
│   │   └── RESULTADO_FASE1.md
│   │
│   ├── grounding/
│   │   ├── IDENTITY.md
│   │   └── RESULTADO_FASE1.md
│   │
│   └── neutralizacion/
│       ├── IDENTITY.md
│       └── RESULTADO_FASE1.md
│
├── ejecutar_fase1.sh ◄────────────── Orquestación + consolidación
├── grafo.json ◄───────────────────── Grafo consolidado (generado)
├── grafo_ejemplo.json ◄───────────── Datos de ejemplo para testing
│
├── setup_grafos.sh ◄──────────────── Script de instalación
├── test_grafo.sh ◄────────────────── Script de testing
│
└── docs/
    ├── ANALISIS_GRAFOS_CONOCIMIENTO.md
    ├── TROUBLESHOOTING_GRAFOS.md
    ├── RESUMEN_IMPLEMENTACION_GRAFOS.md
    ├── EJEMPLOS_USO_GRAFOS.md
    ├── CHECKLIST_GRAFOS.md
    └── ARQUITECTURA_GRAFOS.md ◄────── Este archivo
```

## Tecnologías y Dependencias

```
┌─────────────────────────────────────────────────────────────────┐
│                         STACK                                    │
│                                                                  │
│  Frontend:                                                       │
│  ├─ React 19                                                     │
│  ├─ TypeScript 5.9                                               │
│  ├─ Vite 7.3                                                     │
│  └─ D3.js 7.9 ◄────────────────────────────────────────┐        │
│                                                         │        │
│  Backend:                                               │        │
│  ├─ Node.js 18+                                         │        │
│  ├─ Express                                             │        │
│  └─ node-fetch                                          │        │
│                                                         │        │
│  Orquestación:                                          │        │
│  ├─ Bash                                                │        │
│  └─ jq ◄────────────────────────────────────────────────┘        │
│                                                                  │
│  IA:                                                             │
│  ├─ Anthropic Claude API (agentes)                              │
│  └─ Ollama (thinking generation)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Patrones de Diseño

### 1. Pipeline Pattern
```
Input → Stage 1 → Stage 2 → Stage 3 → Output
thinking → agentes → consolidación → visualización
```

### 2. Observer Pattern
```
Dashboard (Observer)
    ↓ polling
Server (Subject)
    ↓ reads
grafo.json (State)
```

### 3. Component Pattern
```
App (Container)
  └─ KnowledgeGraph (Presentational)
       ├─ SVG (D3 Visualization)
       ├─ DetailPanel (Conditional)
       └─ Legend (Static)
```

### 4. Strategy Pattern
```
Agente (Interface)
  ├─ BifurcacionesAgente (Strategy)
  ├─ GroundingAgente (Strategy)
  ├─ NeutralizacionAgente (Strategy)
  └─ AusenciasAgente (Strategy)
```

## Consideraciones de Performance

### Optimizaciones Implementadas
- Force simulation con alpha decay para convergencia rápida
- Lazy loading del grafo (solo cuando se activa la pestaña)
- Consolidación de JSON en bash (más rápido que Node.js para este caso)
- SVG en lugar de Canvas (mejor para interactividad)

### Limitaciones Conocidas
- Grafos >100 nodos pueden ser lentos
- Simulación de fuerzas es CPU-intensiva
- No hay virtualización de nodos

### Mejoras Futuras
- Clustering para grafos grandes
- Web Workers para simulación
- Canvas fallback para grafos muy grandes
- Paginación o filtrado por agente

---

**Versión:** 1.0.0  
**Fecha:** 3 de abril de 2026  
**Autor:** Kiro AI Assistant
