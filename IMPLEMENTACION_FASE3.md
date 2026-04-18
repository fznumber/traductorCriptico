# Implementación de Fase 3 - Exposición de la Fragilidad

## Resumen
Se implementó la Fase 3 del sistema TC2026 siguiendo el mismo patrón arquitectónico de Fase 2, con 4 agentes especializados que analizan el thinking como documento de auto-revelación involuntaria.

## Agentes de Fase 3

### 1. Fuentes Activadas (`fuentes_activadas`)
**Arqueología de la decisión epistémica**
- Identifica la "bibliografía fantasma": fuentes que el modelo consideró pero descartó
- Analiza las razones explícitas e implícitas del descarte
- Expone qué corpus sostiene la respuesta sin aparecer en ella
- Revela el mecanismo de validación institucional específico

### 2. Opacidad Residual (`opacidad_residual`)
**Cartografía de lo no-dicho**
- Detecta saltos lógicos sin justificación
- Registra descartes de opciones sin elaboración
- Localiza conclusiones que aparecen sin proceso visible
- Mapea zonas de silencio: preguntas no formuladas, perspectivas no exploradas

### 3. Sensibilidad Contextual (`sensibilidad_contextual`)
**Análisis de dependencia contextual**
- Identifica parámetros de contexto explícitos e implícitos
- Diseña experimentos de variación contextual
- Evalúa grado de dependencia de cada elemento del thinking
- Muestra cuán dependiente del contexto es la validación presentada como general

### 4. Vigencia Provisional (`vigencia_provisional`)
**Arqueología de la temporalidad**
- Identifica marcadores temporales explícitos e implícitos
- Mapea variables de contingencia (corpus, versión, parámetros)
- Evalúa transferibilidad de elementos del thinking
- Expone el thinking como instantánea, no como verdad universal

## Arquitectura Implementada

### Backend (`dashboard/server/`)

#### 1. Workspaces Creados
```
workspaces/
├── fuentes_activadas/IDENTITY.md
├── opacidad_residual/IDENTITY.md
├── sensibilidad_contextual/IDENTITY.md
└── vigencia_provisional/IDENTITY.md
```

Cada workspace contiene:
- System prompt completo con identidad del agente
- Principio operativo específico
- Restricciones críticas (no interpretar, no concluir, no completar)
- Operación analítica detallada
- Formato de salida JSON estructurado
- Ejemplos de operación

#### 2. Servidor (`server.js`)
- Agregado `WORKSPACES_FASE3` con los 4 agentes
- Nuevo endpoint `POST /api/run-phase-3`
- Validación: Fase 3 solo se ejecuta si Fase 2 está completa (4 agentes con SUCCESS)
- Contexto: Fase 3 recibe thinking + resultados de Fase 1 + resultados de Fase 2
- Logs detallados para debugging

```javascript
const WORKSPACES_FASE3 = ['fuentes_activadas', 'opacidad_residual', 'sensibilidad_contextual', 'vigencia_provisional'];
```

#### 3. Base de Datos (`db.js`)
- Agregadas definiciones por defecto de los 4 agentes de Fase 3
- Lectura dinámica desde archivos IDENTITY.md
- Inserción automática en tabla `default_agent_definitions`

### Frontend (`dashboard/client/src/App.tsx`)

#### 1. Nuevo Botón "FASE 3"
- Color naranja (#f59e0b) para diferenciarlo de Fase 2 (morado)
- Se habilita solo cuando `status === 'completed-phase2'`
- Tooltip: "Ejecutar Fase 3 - Exposición de la Fragilidad"

#### 2. Función `runPhase3()`
- Llama al endpoint `/api/run-phase-3`
- Actualiza status a `'processing-phase3'`
- Polling cada 3 segundos para verificar completitud
- Verifica que los 4 agentes de Fase 3 hayan terminado
- Actualiza status a `'completed-phase3'` al finalizar

#### 3. Pestañas de Fase 3
Estructura con dropdown:
```
[FASE 3 ▼] → FUENTES
```

Agentes en dropdown:
- **FUENTES** (fuentes_activadas)
- **OPACIDAD** (opacidad_residual)
- **CONTEXTO** (sensibilidad_contextual)
- **VIGENCIA** (vigencia_provisional)

#### 4. Indicador de Agente Activo
Muestra el nombre del agente de Fase 3 actualmente visualizado al lado del botón de fase.

## Flujo de Ejecución

### Secuencia Completa
1. **Usuario ejecuta "ANALIZAR"**
   - Se genera el thinking
   - Se genera música de fondo
   - Se ejecuta automáticamente Fase 1

2. **Fase 1 completa → Botón "FASE 2" se habilita**
   - Usuario hace click en "FASE 2"
   - Se ejecutan 4 agentes de Fase 2 con contexto de Fase 1

3. **Fase 2 completa → Botón "FASE 3" se habilita**
   - Usuario hace click en "FASE 3"
   - Se ejecutan 4 agentes de Fase 3 con contexto de Fase 1 + Fase 2

4. **Fase 3 completa → Análisis finalizado**
   - Log: "🎉 Análisis completo de las 3 fases"
   - Usuario puede navegar entre todas las pestañas

### Validaciones
- **Fase 2**: Requiere que Fase 1 esté completa (4/4 agentes SUCCESS)
- **Fase 3**: Requiere que Fase 2 esté completa (4/4 agentes SUCCESS)
- Cada fase recibe el contexto acumulado de las fases anteriores

## Principio de Diseño

### Coherencia con Fases Anteriores
- Mismo patrón arquitectónico que Fase 2
- Mismas restricciones críticas: no interpretar, no concluir, no completar
- Mismo formato de output JSON estructurado
- Misma lógica de validación y contexto acumulativo

### Escalabilidad
- La arquitectura permite agregar más fases sin cambios estructurales
- Los workspaces son independientes y modulares
- Las definiciones de agentes son personalizables por sesión
- El sistema de pestañas agrupadas evita saturación de UI

## Diferencia Conceptual de Fase 3

### Fase 1: Detección de Zonas de Opacidad
Identifica ausencias, bifurcaciones, grounding y neutralización en el thinking.

### Fase 2: Estratos de Interferencia
Investiga fuentes externas (RAG), procedencia geopolítica, cambio semántico y patrones contrastivos.

### Fase 3: Exposición de la Fragilidad
**El thinking como documento de auto-revelación involuntaria**
- No busca completar el análisis
- No busca corregir el modelo
- Expone los límites constitutivos del sistema
- Muestra la provisionalidad, opacidad y dependencia contextual como hechos observables

## Archivos Modificados

### Backend
- `dashboard/server/server.js`: Endpoint `/api/run-phase-3` y `WORKSPACES_FASE3`
- `dashboard/server/db.js`: Definiciones por defecto de Fase 3

### Frontend
- `dashboard/client/src/App.tsx`: Botón Fase 3, función `runPhase3()`, pestañas Fase 3

### Workspaces
- `workspaces/fuentes_activadas/IDENTITY.md`
- `workspaces/opacidad_residual/IDENTITY.md`
- `workspaces/sensibilidad_contextual/IDENTITY.md`
- `workspaces/vigencia_provisional/IDENTITY.md`

## Estado
✅ **COMPLETADO** - Fase 3 implementada y lista para uso

## Próximos Pasos Sugeridos
1. Probar la ejecución completa de Fase 1 + Fase 2 + Fase 3
2. Verificar que los resultados se persistan correctamente por sesión
3. Ajustar los system prompts de Fase 3 según resultados reales
4. Considerar integración de visualización de grafos con datos de las 3 fases
