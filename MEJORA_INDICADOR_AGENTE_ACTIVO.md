# Indicador de Agente Activo en Pestañas

## Problema
Cuando el usuario seleccionaba un agente de una fase, el dropdown se cerraba pero no quedaba claro qué agente estaba viendo actualmente. Solo se veía "FASE 1" o "FASE 2" sin indicación del agente específico.

## Solución Implementada

### Indicador Visual
Se agregó un label flotante al lado derecho del botón de fase que muestra el nombre del agente activo:

```
[FASE 1 ▼] → AUSENCIAS
[FASE 2 ▼] → RAG DIRIGIDO
```

### Comportamiento

#### Fase 1
Cuando el usuario está viendo un agente de Fase 1 (ausencias, bifurcaciones, grounding, neutralizacion), aparece:
- `→ AUSENCIAS`
- `→ BIFURCACIONES`
- `→ GROUNDING`
- `→ NEUTRALIZACION`

#### Fase 2
Cuando el usuario está viendo un agente de Fase 2, aparece con nombres abreviados:
- `→ RAG DIRIGIDO` (rag_dirigido)
- `→ PROCEDENCIA` (procedencia_marcos)
- `→ SEMÁNTICA` (cambio_semantico)
- `→ PATRONES` (patrones_contrastivos)

#### Thinking
Cuando está en la pestaña THINKING, no se muestra ningún indicador de agente.

### Implementación Técnica

#### 1. Lógica Condicional (App.tsx)
Se agregó una verificación condicional que muestra el label solo cuando el `activeTab` corresponde a un agente de esa fase:

```tsx
{['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].includes(activeTab) && (
  <span className="active-agent-label">→ {activeTab.toUpperCase()}</span>
)}
```

Para Fase 2, se usa un mapeo para mostrar nombres más cortos:
```tsx
{['rag_dirigido', 'procedencia_marcos', 'cambio_semantico', 'patrones_contrastivos'].includes(activeTab) && (
  <span className="active-agent-label">
    → {
      activeTab === 'rag_dirigido' ? 'RAG DIRIGIDO' :
      activeTab === 'procedencia_marcos' ? 'PROCEDENCIA' :
      activeTab === 'cambio_semantico' ? 'SEMÁNTICA' :
      activeTab === 'patrones_contrastivos' ? 'PATRONES' : ''
    }
  </span>
)}
```

#### 2. Estilos CSS
Se creó la clase `.active-agent-label` con:
- Posicionamiento absoluto a la derecha del botón
- Fondo semi-transparente verde (tema accent)
- Borde sutil con el color accent
- Tamaño de fuente pequeño (9px)
- `pointer-events: none` para no interferir con clicks
- `z-index: 50` para estar sobre el botón pero bajo el dropdown

```css
.active-agent-label {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  font-size: 9px;
  color: var(--accent);
  font-weight: bold;
  letter-spacing: 0.5px;
  background: rgba(0, 255, 65, 0.1);
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid rgba(0, 255, 65, 0.3);
  pointer-events: none;
  white-space: nowrap;
  z-index: 50;
}
```

### Ventajas del Diseño

1. **Claridad Visual**: El usuario siempre sabe qué agente está viendo
2. **No Intrusivo**: El label es pequeño y está posicionado de forma que no interfiere con la UI
3. **Consistente**: Usa el mismo color accent del sistema (verde)
4. **Responsive**: Se adapta al contenido con `white-space: nowrap`
5. **Accesible**: No interfiere con la interacción del usuario (`pointer-events: none`)

### Ubicación Visual
El indicador aparece:
- A la derecha del botón "FASE 1" o "FASE 2"
- Centrado verticalmente
- Solo cuando hay un agente de esa fase activo
- Desaparece cuando se abre el dropdown (el dropdown tiene mayor z-index)

## Archivos Modificados
- `dashboard/client/src/App.tsx`: Lógica condicional y estilos CSS

## Estado
✅ **COMPLETADO** - El usuario ahora puede ver claramente qué agente está visualizando
