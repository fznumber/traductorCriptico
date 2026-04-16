# Configuración de Agentes - Interfaz de Usuario

## Resumen
Se ha implementado una interfaz completa para configurar las definiciones de los 4 agentes (ausencias, bifurcaciones, grounding, neutralizacion) por sesión.

## Características Implementadas

### 1. Botón "🤖 AGENTES" en el Header
- Ubicado junto a "📋 SESIONES" y "⚙️ Configuración"
- Color morado (#a78bfa) para distinguirlo
- Deshabilitado si no hay sesión activa
- Muestra el panel de configuración al hacer click

### 2. Panel de Configuración de Agentes

**Ubicación:** Desplegable debajo del header

**Contenido:**
- Lista de los 4 agentes con preview de su definición
- Indicador visual si el agente está personalizado (✎)
- Botones de acción por agente:
  - ✏️ Editar: Abre el editor de definición
  - ↺ Reset: Resetea a definición por defecto (solo si está personalizado)

**Diseño:**
- Fondo oscuro con borde morado
- Scroll vertical para contenido largo
- Hover effects en cada agente
- Máximo 500px de altura

### 3. Modal de Edición de Agente

**Características:**
- Overlay con blur de fondo
- Editor de texto grande (textarea) con scroll
- Sintaxis resaltada con fuente monospace
- Contador de caracteres en tiempo real
- Indicador si está usando definición por defecto
- Botones:
  - Cancelar: Cierra sin guardar
  - 💾 Guardar Cambios: Persiste la definición

**Funcionalidad:**
- Click fuera del modal para cerrar
- ESC para cerrar (nativo del navegador)
- Auto-resize del textarea
- Scroll interno para definiciones largas

## Flujo de Uso

### Ver Configuración de Agentes
```
1. Usuario hace login
2. Selecciona o crea una sesión
3. Click en "🤖 AGENTES"
4. Se abre panel con los 4 agentes
5. Ve preview de cada definición
6. Ve cuáles están personalizados (✎)
```

### Editar Definición de un Agente
```
1. En el panel de agentes
2. Click en "✏️ Editar" del agente deseado
3. Se abre modal con editor de texto
4. Modifica la definición (IDENTITY.md)
5. Ve contador de caracteres
6. Click en "💾 Guardar Cambios"
7. Modal se cierra
8. Definición queda guardada para esa sesión
9. Aparece indicador (✎) en el agente
```

### Resetear Agente a Default
```
1. En el panel de agentes
2. Agente debe estar personalizado (✎)
3. Click en "↺ Reset"
4. Confirmar en diálogo
5. Definición vuelve a la por defecto
6. Indicador (✎) desaparece
```

### Cambiar de Sesión
```
1. Sesión A tiene agentes personalizados
2. Usuario cambia a Sesión B
3. Se cargan las definiciones de Sesión B
4. Cada sesión mantiene sus propias definiciones
```

## Indicadores Visuales

### Badge de Personalización (✎)
- Aparece junto al nombre del agente
- Color morado claro (#c4b5fd)
- Tooltip: "Personalizado para esta sesión"
- Solo visible si la definición difiere del default

### Estados del Botón "🤖 AGENTES"
- **Habilitado:** Hay sesión activa, color morado
- **Deshabilitado:** No hay sesión activa, gris opaco
- **Hover:** Fondo morado oscuro

### Preview del Agente
- Primeros 150 caracteres de la definición
- Color gris (#666)
- Ellipsis (...) al final
- Ayuda a identificar rápidamente el contenido

## Integración con Backend

### Carga de Definiciones
```typescript
// Al hacer login
await loadDefaultDefinitions();  // Carga defaults globales
await loadAgentDefinitions(sessionId);  // Carga definiciones de la sesión

// Al cambiar sesión
await loadAgentDefinitions(newSessionId);
```

### Guardado de Definiciones
```typescript
// POST /api/agent-definitions/:sessionId/:agentName
{
  "definition": "# IDENTITY.md - Analizador...\n\n..."
}
```

### Reset de Definiciones
```typescript
// DELETE /api/agent-definitions/:sessionId/:agentName
// Elimina la personalización, vuelve a usar default
```

### Detección de Personalización
```typescript
const isAgentCustomized = (agentName: string) => {
  return agentDefinitions[agentName] !== defaultDefinitions[agentName];
};
```

## Estructura de Datos

### Estado del Frontend
```typescript
const [agentDefinitions, setAgentDefinitions] = useState<Record<string, string>>({
  ausencias: "# IDENTITY.md - Cartógrafo...",
  bifurcaciones: "# IDENTITY.md - Analizador...",
  grounding: "# IDENTITY.md - Verificador...",
  neutralizacion: "# IDENTITY.md - Analizador..."
});

const [defaultDefinitions, setDefaultDefinitions] = useState<Record<string, string>>({
  // Misma estructura, pero con definiciones por defecto
});

const [editingAgent, setEditingAgent] = useState<string | null>(null);
const [editingDefinition, setEditingDefinition] = useState<string>('');
```

## Estilos CSS

### Colores del Tema
- **Principal:** #a78bfa (morado claro)
- **Oscuro:** #4c1d95 (morado oscuro)
- **Hover:** #5b21b6 (morado medio)
- **Texto:** #c4b5fd (morado muy claro)

### Componentes Estilizados
- `.agent-config-panel` - Panel principal
- `.agent-item` - Cada agente en la lista
- `.modal-overlay` - Fondo del modal
- `.modal-content` - Contenedor del modal
- `.agent-editor` - Textarea del editor

## Casos de Uso

### Caso 1: Ajustar Agente para Análisis Específico
**Escenario:** Análisis de textos legales

1. Usuario crea sesión "Análisis Legal"
2. Abre configuración de agentes
3. Edita "bifurcaciones" para enfocarse en interpretaciones legales
4. Edita "grounding" para verificar citas de leyes
5. Guarda cambios
6. Ejecuta análisis con agentes personalizados
7. Resultados reflejan la personalización

### Caso 2: Comparar Diferentes Configuraciones
**Escenario:** Experimentar con diferentes enfoques

1. Sesión A: Agentes con definiciones por defecto
2. Sesión B: "ausencias" personalizado para enfoque geopolítico
3. Sesión C: Todos los agentes personalizados para análisis feminista
4. Usuario cambia entre sesiones para comparar resultados
5. Cada sesión mantiene su configuración independiente

### Caso 3: Resetear Experimento Fallido
**Escenario:** Personalización no funcionó como esperado

1. Usuario personalizó "neutralizacion"
2. Resultados no son satisfactorios
3. Click en "↺ Reset" en el agente
4. Confirma reset
5. Agente vuelve a definición por defecto
6. Próximo análisis usa definición original

## Mejoras Futuras Sugeridas

1. **Previsualización en Vivo:** Ver cómo afectaría el cambio antes de guardar
2. **Templates:** Guardar configuraciones como plantillas reutilizables
3. **Diff Viewer:** Comparar definición actual vs default
4. **Syntax Highlighting:** Resaltar sintaxis Markdown en el editor
5. **Validación:** Verificar que la definición tenga estructura válida
6. **Historial:** Ver cambios anteriores de definiciones
7. **Exportar/Importar:** Compartir configuraciones entre usuarios
8. **Búsqueda:** Buscar texto dentro de las definiciones
9. **Atajos de Teclado:** Ctrl+S para guardar, Ctrl+E para editar
10. **Auto-guardado:** Guardar borrador mientras se edita

## Notas Técnicas

### Persistencia
- Las definiciones se guardan en `agent_definitions` table
- FK a `session_id` con CASCADE DELETE
- UNIQUE constraint en (session_id, agent_name)
- Si no existe personalización, usa `default_agent_definitions`

### Performance
- Definiciones se cargan solo cuando se abre el panel
- No se recargan en cada render
- Modal se monta/desmonta según necesidad

### Accesibilidad
- Botones con títulos descriptivos
- Confirmación antes de acciones destructivas
- Indicadores visuales claros
- Contraste de colores adecuado

## Conclusión

La interfaz de configuración de agentes está completa y funcional. Permite personalizar cada agente por sesión de forma intuitiva, con indicadores visuales claros y flujo de trabajo eficiente.

**Estado:** ✅ IMPLEMENTADO Y FUNCIONAL
