# Mejora del Panel de Configuración de Agentes

## Resumen
Se amplió el panel de configuración de agentes para incluir los 12 agentes de las 3 fases, organizados por secciones.

## Problema Anterior
El panel solo mostraba los 4 agentes de Fase 1:
- ✅ ausencias
- ✅ bifurcaciones
- ✅ grounding
- ✅ neutralizacion

**Faltaban**:
- ❌ 4 agentes de Fase 2
- ❌ 4 agentes de Fase 3

## Solución Implementada

### Estructura del Panel Actualizado

```
┌─────────────────────────────────────────────┐
│ Configuración de Agentes - Sesión #5    [✕]│
├─────────────────────────────────────────────┤
│                                             │
│ FASE 1 - Detección de Zonas de Opacidad    │
│ ├─ AUSENCIAS                    [✏️][↺]    │
│ ├─ BIFURCACIONES                [✏️][↺]    │
│ ├─ GROUNDING                    [✏️][↺]    │
│ └─ NEUTRALIZACION               [✏️][↺]    │
│                                             │
│ FASE 2 - Estratos de Interferencia         │
│ ├─ RAG DIRIGIDO                 [✏️][↺]    │
│ ├─ PROCEDENCIA MARCOS           [✏️][↺]    │
│ ├─ CAMBIO SEMÁNTICO             [✏️][↺]    │
│ └─ PATRONES CONTRASTIVOS        [✏️][↺]    │
│                                             │
│ FASE 3 - Exposición de la Fragilidad       │
│ ├─ FUENTES ACTIVADAS            [✏️][↺]    │
│ ├─ OPACIDAD RESIDUAL            [✏️][↺]    │
│ ├─ SENSIBILIDAD CONTEXTUAL      [✏️][↺]    │
│ └─ VIGENCIA PROVISIONAL         [✏️][↺]    │
│                                             │
└─────────────────────────────────────────────┘
```

### Agentes Agregados

#### Fase 2 (4 agentes)
1. **RAG DIRIGIDO** (`rag_dirigido`)
   - Recuperación dirigida por ausencias estructurales

2. **PROCEDENCIA MARCOS** (`procedencia_marcos`)
   - Rastreo de procedencia geopolítica

3. **CAMBIO SEMÁNTICO** (`cambio_semantico`)
   - Análisis de términos naturalizados

4. **PATRONES CONTRASTIVOS** (`patrones_contrastivos`)
   - Estructuras lingüísticas validadas

#### Fase 3 (4 agentes)
1. **FUENTES ACTIVADAS** (`fuentes_activadas`)
   - Arqueología de la decisión epistémica

2. **OPACIDAD RESIDUAL** (`opacidad_residual`)
   - Cartografía de lo no-dicho

3. **SENSIBILIDAD CONTEXTUAL** (`sensibilidad_contextual`)
   - Análisis de dependencia contextual

4. **VIGENCIA PROVISIONAL** (`vigencia_provisional`)
   - Arqueología de la temporalidad

## Cambios Técnicos

### 1. Estructura HTML
Se agregaron secciones por fase con títulos:

```tsx
<div className="agent-phase-section">
  <div className="phase-title">FASE 1 - Detección de Zonas de Opacidad</div>
  {/* Agentes de Fase 1 */}
</div>

<div className="agent-phase-section">
  <div className="phase-title">FASE 2 - Estratos de Interferencia</div>
  {/* Agentes de Fase 2 */}
</div>

<div className="agent-phase-section">
  <div className="phase-title">FASE 3 - Exposición de la Fragilidad</div>
  {/* Agentes de Fase 3 */}
</div>
```

### 2. Nombres Legibles
Se agregó mapeo de nombres técnicos a nombres legibles:

```tsx
{agentName === 'rag_dirigido' ? 'RAG DIRIGIDO' :
 agentName === 'procedencia_marcos' ? 'PROCEDENCIA MARCOS' :
 agentName === 'cambio_semantico' ? 'CAMBIO SEMÁNTICO' :
 agentName === 'patrones_contrastivos' ? 'PATRONES CONTRASTIVOS' : 
 agentName.toUpperCase()}
```

### 3. Estilos CSS Agregados

#### Sección de Fase
```css
.agent-phase-section {
  display: flex; 
  flex-direction: column; 
  gap: 10px;
}
```

#### Título de Fase
```css
.phase-title {
  font-size: 11px; 
  font-weight: bold; 
  color: #a78bfa;
  letter-spacing: 1px; 
  padding: 8px 12px;
  background: #1a1a2e; 
  border-left: 3px solid #a78bfa;
  border-radius: 2px; 
  margin-bottom: 5px;
}
```

#### Panel Expandido
```css
.agent-config-panel {
  max-height: 70vh;  /* Antes: 500px */
}
```

## Funcionalidades Disponibles

### Para Cada Agente (12 total)

#### 1. Ver Definición
- Preview de los primeros 150 caracteres
- Indicador visual si está personalizado (badge ✎)

#### 2. Editar Definición
- Click en "✏️ Editar"
- Abre modal con editor de texto completo
- Muestra contador de caracteres y líneas
- Indica si es definición por defecto o modificada

#### 3. Resetear a Default
- Click en "↺ Reset"
- Solo visible si el agente está personalizado
- Elimina la personalización y vuelve al default

#### 4. Guardar Cambios
- Los cambios se guardan por sesión
- No afectan otras sesiones del mismo usuario
- No afectan las definiciones por defecto

## Persistencia de Datos

### Base de Datos
```sql
-- Definiciones personalizadas por sesión
CREATE TABLE agent_definitions (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    agent_name TEXT NOT NULL,
    definition TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, agent_name)
);

-- Definiciones por defecto (globales)
CREATE TABLE default_agent_definitions (
    id INTEGER PRIMARY KEY,
    agent_name TEXT UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Lógica de Prioridad
1. **Buscar personalización**: `agent_definitions` WHERE session_id = X AND agent_name = Y
2. **Si no existe**: Usar `default_agent_definitions` WHERE agent_name = Y
3. **Si no existe**: Retornar string vacío

## Casos de Uso

### Caso 1: Ajustar Agente para Análisis Específico
Usuario quiere que el agente "ausencias" sea más estricto en una sesión específica:
1. Abre panel de agentes
2. Click en "✏️ Editar" en AUSENCIAS
3. Modifica las restricciones
4. Guarda cambios
5. Solo esa sesión usa la definición modificada

### Caso 2: Experimentar con Fase 3
Usuario quiere probar diferentes enfoques en "sensibilidad_contextual":
1. Abre panel de agentes
2. Navega a FASE 3
3. Edita SENSIBILIDAD CONTEXTUAL
4. Ejecuta análisis
5. Si no funciona, click en "↺ Reset"

### Caso 3: Personalización Masiva
Usuario quiere personalizar todos los agentes de Fase 2:
1. Abre panel de agentes
2. Edita RAG DIRIGIDO → Guarda
3. Edita PROCEDENCIA MARCOS → Guarda
4. Edita CAMBIO SEMÁNTICO → Guarda
5. Edita PATRONES CONTRASTIVOS → Guarda
6. Todos los cambios se aplican a esa sesión

## Ventajas del Diseño

### 1. Organización Clara
- Agentes agrupados por fase
- Títulos descriptivos de cada fase
- Fácil navegación visual

### 2. Escalabilidad
- Fácil agregar más fases en el futuro
- Estructura modular y repetible

### 3. Consistencia
- Mismo diseño para los 12 agentes
- Mismas funcionalidades en todos

### 4. Usabilidad
- Scroll suave para ver todos los agentes
- Altura adaptativa (70vh)
- Indicadores visuales claros

## Archivos Modificados
- `dashboard/client/src/App.tsx`:
  - Estructura HTML del panel
  - Estilos CSS
  - Lógica de renderizado

## Estado
✅ **COMPLETADO** - Panel de agentes ahora muestra los 12 agentes de las 3 fases

## Próximos Pasos Sugeridos
1. Probar edición de agentes de Fase 2 y 3
2. Verificar que los cambios se persistan correctamente
3. Confirmar que el reset funciona para todos los agentes
4. Considerar agregar búsqueda/filtro si el panel crece más
