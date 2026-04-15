# Migración: Definiciones de Agentes en Base de Datos

## Cambios Implementados

### 1. Nuevas Tablas en SQLite

**`default_agent_definitions`**: Almacena las definiciones por defecto de los 4 agentes
- `id`: Primary key
- `agent_name`: Nombre del agente (bifurcaciones, grounding, neutralizacion, ausencias)
- `definition`: Texto completo del IDENTITY.md
- `updated_at`: Timestamp de última actualización

**`agent_definitions`**: Almacena definiciones personalizadas por sesión
- `id`: Primary key
- `session_id`: FK a sessions
- `agent_name`: Nombre del agente
- `definition`: Definición personalizada
- `created_at`: Timestamp de creación
- `UNIQUE(session_id, agent_name)`: Un usuario solo puede tener una definición personalizada por agente por sesión

### 2. Nuevos Endpoints API

#### Obtener definiciones de todos los agentes para una sesión
```
GET /api/agent-definitions/:sessionId
```
Retorna un objeto con las definiciones de los 4 agentes (personalizadas o por defecto).

#### Obtener definición de un agente específico
```
GET /api/agent-definitions/:sessionId/:agentName
```
Retorna la definición de un agente para una sesión específica.

#### Actualizar definición de un agente
```
POST /api/agent-definitions/:sessionId/:agentName
Body: { "definition": "texto de la definición..." }
```
Crea o actualiza una definición personalizada para un agente en una sesión.

#### Resetear definición a valor por defecto
```
DELETE /api/agent-definitions/:sessionId/:agentName
```
Elimina la definición personalizada, volviendo al valor por defecto.

#### Obtener todas las definiciones por defecto
```
GET /api/default-agent-definitions
```
Retorna las definiciones por defecto de todos los agentes.

### 3. Cambios en el Código

**`dashboard/server/db.js`**:
- Agregadas tablas `default_agent_definitions` y `agent_definitions`
- Cargadas las 4 definiciones por defecto desde los archivos IDENTITY.md originales
- Las definiciones se insertan automáticamente al iniciar la BD

**`dashboard/server/server.js`**:
- Nueva función `getAgentDefinition(sessionId, agentName)` que busca primero definiciones personalizadas, luego por defecto
- Función `ejecutarAgente()` modificada para leer desde BD en lugar de archivos
- Agregados 5 nuevos endpoints para gestionar definiciones

### 4. Flujo de Trabajo

#### Comportamiento por Defecto
1. Usuario crea una sesión
2. Al ejecutar análisis, cada agente usa su definición por defecto de la BD
3. Los resultados se guardan en `agent_logs` como siempre

#### Personalización de Agentes
1. Usuario obtiene la definición actual: `GET /api/agent-definitions/:sessionId/:agentName`
2. Usuario modifica el texto según sus necesidades
3. Usuario guarda la definición personalizada: `POST /api/agent-definitions/:sessionId/:agentName`
4. Futuros análisis en esa sesión usarán la definición personalizada
5. Usuario puede resetear: `DELETE /api/agent-definitions/:sessionId/:agentName`

### 5. Ventajas

- **Personalización por sesión**: Cada usuario puede ajustar los agentes según el contexto de análisis
- **Sin archivos**: Todo en BD, más fácil de gestionar y versionar
- **Historial**: Las definiciones personalizadas quedan registradas con timestamp
- **Rollback fácil**: Eliminar la personalización vuelve al default
- **Escalable**: Fácil agregar nuevos agentes o modificar defaults globalmente

### 6. Migración de Datos

Las definiciones por defecto se cargan automáticamente desde el código al iniciar `db.js`.
Los archivos `workspaces/*/IDENTITY.md` ya NO se usan en runtime, solo sirvieron para poblar la BD inicial.

### 7. Testing

```bash
# Verificar que las tablas existen
sqlite3 dashboard/server/tc2026.db ".tables"

# Ver las definiciones por defecto
sqlite3 dashboard/server/tc2026.db "SELECT agent_name FROM default_agent_definitions;"

# Probar endpoint
curl http://localhost:3001/api/default-agent-definitions

# Personalizar un agente para sesión 1
curl -X POST http://localhost:3001/api/agent-definitions/1/bifurcaciones \
  -H "Content-Type: application/json" \
  -d '{"definition": "Sos un analizador modificado..."}'

# Verificar personalización
curl http://localhost:3001/api/agent-definitions/1/bifurcaciones
```

### 8. Próximos Pasos (Opcional)

- [ ] Agregar UI en el dashboard para editar definiciones
- [ ] Implementar versionado de definiciones (historial de cambios)
- [ ] Permitir compartir definiciones personalizadas entre usuarios
- [ ] Agregar validación de sintaxis para el formato JSON-grafo
- [ ] Implementar templates de definiciones predefinidos

## Rollback

Si necesitas volver al sistema anterior:

```bash
# Restaurar backup
cp dashboard/server/tc2026.db.backup dashboard/server/tc2026.db

# Revertir cambios en git
git checkout dashboard/server/db.js dashboard/server/server.js
```
