# Implementación de Fase 2 - Estratos de Interferencia

## Resumen

Se ha implementado completamente la Fase 2 del proyecto Traducción Crítica TC2026, siguiendo el mismo patrón arquitectónico de la Fase 1.

## Componentes Implementados

### 1. Backend

#### Nuevos Workspaces (4 agentes)
- `rag_dirigido` - RAG dirigido desde ausencias estructurales
- `procedencia_marcos` - Procedencia de marcos normativos
- `cambio_semantico` - Cambio semántico histórico
- `patrones_contrastivos` - Patrones discursivos contrastivos

#### Archivos Creados
- `workspaces/rag_dirigido/IDENTITY.md` - System prompt completo con instrucciones JSON
- `workspaces/procedencia_marcos/IDENTITY.md` - System prompt completo con instrucciones JSON
- `workspaces/cambio_semantico/IDENTITY.md` - System prompt completo con instrucciones JSON
- `workspaces/patrones_contrastivos/IDENTITY.md` - System prompt completo con instrucciones JSON
- Archivos `.openclaw/workspace-state.json` para cada workspace

#### Modificaciones en `dashboard/server/server.js`
- Constantes separadas: `WORKSPACES_FASE1` y `WORKSPACES_FASE2`
- Nuevo endpoint `POST /api/run-phase-2`:
  - Verifica que Fase 1 esté completa (4 agentes con status SUCCESS)
  - Obtiene resultados de Fase 1 como contexto adicional
  - Ejecuta los 4 agentes de Fase 2 en paralelo
  - Pasa el thinking + resultados de Fase 1 como input

#### Modificaciones en `dashboard/server/db.js`
- Agregadas definiciones por defecto de los 4 nuevos agentes
- Definiciones incluyen instrucciones de output estructurado en JSON
- Sistema de grafos de conocimiento preparado

### 2. Frontend

#### Modificaciones en `dashboard/client/src/App.tsx`

**Nueva función `runPhase2()`:**
- Ejecuta el endpoint `/api/run-phase-2`
- Valida que Fase 1 esté completa
- Polling de resultados cada 3 segundos
- Actualiza estado a `processing-phase2` y luego `completed-phase2`
- Logs informativos en consola

**Nuevas pestañas de resultados:**
- RAG - RAG Dirigido desde Ausencias
- PROCEDENCIA - Procedencia de Marcos Normativos
- SEMÁNTICA - Cambio Semántico Histórico
- PATRONES - Patrones Discursivos Contrastivos

**Nuevo botón "FASE 2":**
- Se habilita solo cuando Fase 1 está completa (`status === 'completed'`)
- Color morado distintivo (#7c3aed)
- Tooltip explicativo
- Deshabilitado durante grabación o transcripción

**Estados actualizados:**
- `isRunning` incluye ahora `processing-phase2`
- Logs mejorados con indicadores de fase

## Flujo de Ejecución

1. Usuario ingresa un enunciado normativo
2. Click en "ANALIZAR" → Ejecuta Fase 1 (4 agentes)
3. Cuando Fase 1 completa → Botón "FASE 2" se habilita
4. Click en "FASE 2" → Ejecuta Fase 2 (4 agentes adicionales)
5. Fase 2 recibe:
   - El thinking original del LLM
   - Los resultados completos de Fase 1
6. Los 4 agentes de Fase 2 procesan en paralelo
7. Resultados disponibles en pestañas individuales

## Arquitectura Coherente

### Fase 1 - Desacoplamiento de la Verosimilitud
- Agentes: ausencias, bifurcaciones, grounding, neutralización
- Input: thinking del LLM
- Output: JSON estructurado para grafos

### Fase 2 - Estratos de Interferencia
- Agentes: rag_dirigido, procedencia_marcos, cambio_semantico, patrones_contrastivos
- Input: thinking del LLM + resultados de Fase 1
- Output: JSON estructurado para grafos
- Principio: usar las ausencias de Fase 1 como punto de partida

## Características Técnicas

- **Ejecución paralela**: Los 4 agentes de cada fase se ejecutan simultáneamente
- **Validación de dependencias**: Fase 2 solo se ejecuta si Fase 1 está completa
- **Contexto enriquecido**: Fase 2 recibe resultados de Fase 1 como contexto adicional
- **Output estructurado**: Todos los agentes generan JSON para grafos de conocimiento
- **Persistencia por sesión**: Cada sesión mantiene sus propios resultados de ambas fases
- **UI responsiva**: Pestañas dinámicas, estados claros, feedback visual

## Próximos Pasos

1. Probar la ejecución completa de Fase 1 + Fase 2
2. Verificar que los resultados se persistan correctamente por sesión
3. Implementar Fase 3 (Exposición de la Fragilidad) siguiendo el mismo patrón
4. Integrar visualización de grafos de conocimiento con datos de ambas fases

## Notas Importantes

- Los system prompts siguen el principio de "no interpretar, no concluir, solo hacer visible"
- Cada agente hace un solo gesto analítico específico
- El output JSON está diseñado para alimentar grafos de conocimiento
- La arquitectura es escalable para agregar Fase 3 sin cambios estructurales
