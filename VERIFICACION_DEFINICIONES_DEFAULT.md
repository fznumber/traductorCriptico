# Verificación: Definiciones por Defecto de Agentes

## ✅ Estado Confirmado

Las definiciones por defecto de los agentes están **INTACTAS** y **COMPLETAS**.

## 📊 Definiciones Verificadas

### Tabla: `default_agent_definitions`

| Agente | Caracteres | Estado |
|--------|-----------|--------|
| bifurcaciones | 2,115 | ✅ Completa |
| grounding | 2,458 | ✅ Completa |
| neutralizacion | 2,558 | ✅ Completa |
| ausencias | 2,539 | ✅ Completa |

## 🔍 Contenido Verificado

### bifurcaciones
```
# IDENTITY.md - Analizador de Bifurcaciones

Sos un analizador de procesos de decisión en modelos de lenguaje...
```

### grounding
```
# IDENTITY.md - Verificador de Grounding

Sos un verificador de anclaje factual en procesos de razonamiento LLM...
```

### neutralizacion
```
# IDENTITY.md - Analizador de Neutralización

Sos un analizador de mecanismos de auto-validación en modelos de lenguaje...
```

### ausencias
```
# IDENTITY.md - Cartógrafo de Ausencias

Sos un cartógrafo de ausencias en procesos de razonamiento LLM...
```

## 🔄 Cómo Funcionan

### Dos Tablas Separadas

**1. `default_agent_definitions` (GLOBAL)**
- Definiciones por defecto para todos los usuarios
- Se cargan al iniciar el servidor desde el código
- NO se eliminan con el script de limpieza
- Sirven como fallback

**2. `agent_definitions` (POR SESIÓN)**
- Definiciones personalizadas por sesión
- Se crean cuando un usuario edita un agente
- SÍ se eliminan con el script de limpieza
- Tienen prioridad sobre las por defecto

### Lógica de Resolución

```javascript
function getAgentDefinition(sessionId, agentName) {
    // 1. Buscar personalización de la sesión
    const custom = db.prepare(
        'SELECT definition FROM agent_definitions WHERE session_id = ? AND agent_name = ?'
    ).get(sessionId, agentName);
    
    if (custom) return custom.definition;  // ← Usa personalizada
    
    // 2. Si no existe, usar por defecto
    const defaultDef = db.prepare(
        'SELECT definition FROM default_agent_definitions WHERE agent_name = ?'
    ).get(agentName);
    
    return defaultDef ? defaultDef.definition : '';  // ← Usa default
}
```

## 📝 Lo Que Se Eliminó

El script `reset_sessions.js` eliminó:
- ✅ Sesiones
- ✅ Logs de agentes
- ✅ Configuraciones de audio
- ✅ Estados de UI
- ✅ **Definiciones personalizadas** (tabla `agent_definitions`)
- ✅ Logs de actividad

## 📝 Lo Que NO Se Eliminó

El script mantuvo:
- ✅ Usuarios
- ✅ **Definiciones por defecto** (tabla `default_agent_definitions`)

## 🧪 Prueba

### Verificar Definiciones por Defecto

```bash
cd dashboard/server
sqlite3 tc2026.db "SELECT agent_name, length(definition) FROM default_agent_definitions;"
```

**Resultado esperado:**
```
bifurcaciones|2115
grounding|2458
neutralizacion|2558
ausencias|2539
```

### Ver Contenido Completo

```bash
cd dashboard/server
sqlite3 tc2026.db "SELECT definition FROM default_agent_definitions WHERE agent_name = 'ausencias';"
```

## 🎯 Comportamiento Esperado

### Al Crear Nueva Sesión

1. Usuario crea Sesión #1
2. Usuario abre "🤖 AGENTES"
3. Ve los 4 agentes SIN indicador (✎)
4. Todos usan definiciones por defecto

### Al Personalizar Agente

1. Usuario edita "ausencias"
2. Guarda cambios
3. Se crea registro en `agent_definitions` para esa sesión
4. Aparece indicador (✎) en "ausencias"
5. Los otros 3 siguen usando por defecto

### Al Cambiar de Sesión

1. Usuario cambia a Sesión #2
2. Sesión #2 no tiene personalizaciones
3. Todos los agentes usan por defecto
4. No hay indicadores (✎)

### Al Resetear Agente

1. Usuario click en "↺ Reset" en "ausencias"
2. Se elimina registro de `agent_definitions`
3. Desaparece indicador (✎)
4. Vuelve a usar definición por defecto

## 🔄 Recarga de Definiciones por Defecto

Las definiciones por defecto se cargan automáticamente al iniciar el servidor desde el código en `db.js`:

```javascript
const defaultDefinitions = {
    'bifurcaciones': `# IDENTITY.md - Analizador de Bifurcaciones...`,
    'grounding': `# IDENTITY.md - Verificador de Grounding...`,
    'neutralizacion': `# IDENTITY.md - Analizador de Neutralización...`,
    'ausencias': `# IDENTITY.md - Cartógrafo de Ausencias...`
};

// Insertar definiciones por defecto si no existen
const insertDefault = db.prepare(
    'INSERT OR IGNORE INTO default_agent_definitions (agent_name, definition) VALUES (?, ?)'
);
Object.entries(defaultDefinitions).forEach(([name, def]) => insertDefault.run(name, def));
```

El `INSERT OR IGNORE` asegura que:
- Si no existen, se crean
- Si ya existen, se mantienen (no se sobrescriben)

## ✅ Conclusión

Las definiciones por defecto de los agentes están:
- ✅ Completas (2,115 - 2,558 caracteres cada una)
- ✅ Intactas (no se eliminaron)
- ✅ Funcionales (se usan como fallback)
- ✅ Protegidas (el script de limpieza no las toca)

**No hay ningún problema con las definiciones por defecto. Están todas ahí y funcionando correctamente.**
