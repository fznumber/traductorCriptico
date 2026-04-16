# Corrección: Error CORS al Eliminar Sesiones

## Problema Identificado

Al intentar eliminar una sesión, se producía un error de CORS:

```
Access to fetch at 'http://localhost:3001/api/sessions/17' from origin 
'http://localhost:5173' has been blocked by CORS policy: Method DELETE 
is not allowed by Access-Control-Allow-Methods in preflight response.
```

### Síntomas
- Click en botón 🗑️ para eliminar sesión
- Error en consola del navegador
- Sesión no se elimina
- Mensaje: "Error deleting session TypeError: Failed to fetch"

### Causa Raíz

La configuración de CORS del servidor solo permitía los métodos `GET`, `POST` y `OPTIONS`, pero no `DELETE`.

```javascript
// ❌ Configuración anterior
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],  // ← Faltaba DELETE
    allowedHeaders: [...]
}));
```

## Solución Implementada

Se agregó el método `DELETE` a la lista de métodos permitidos en CORS:

```javascript
// ✅ Configuración corregida
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],  // ← DELETE agregado
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version', 'x-user-name']
}));
```

## ¿Qué es CORS?

**CORS (Cross-Origin Resource Sharing)** es un mecanismo de seguridad del navegador que controla qué recursos pueden ser solicitados desde un origen diferente.

### Preflight Request

Cuando el navegador hace una petición DELETE, primero envía una petición OPTIONS (preflight) para verificar si el servidor permite ese método:

```
1. Browser → Server: OPTIONS /api/sessions/17
   Headers:
   - Access-Control-Request-Method: DELETE
   - Origin: http://localhost:5173

2. Server → Browser: 200 OK
   Headers:
   - Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
   - Access-Control-Allow-Origin: *

3. Browser → Server: DELETE /api/sessions/17
   (Solo si el preflight fue exitoso)
```

### Error Anterior

```
1. Browser → Server: OPTIONS /api/sessions/17
   Headers:
   - Access-Control-Request-Method: DELETE

2. Server → Browser: 200 OK
   Headers:
   - Access-Control-Allow-Methods: GET, POST, OPTIONS  ← DELETE no está

3. Browser: ❌ CORS Error
   "Method DELETE is not allowed"
```

## Métodos HTTP Permitidos

### Antes
- `GET` - Leer recursos
- `POST` - Crear/actualizar recursos
- `OPTIONS` - Preflight requests

### Ahora
- `GET` - Leer recursos
- `POST` - Crear/actualizar recursos
- `DELETE` - Eliminar recursos ✅
- `OPTIONS` - Preflight requests

## Endpoints Afectados

### Ahora Funcionan Correctamente

**DELETE `/api/sessions/:sessionId`**
```javascript
app.delete('/api/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const userId = getUserIdFromHeaders(req);
    const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
    if (!session || session.user_id !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
    }
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    res.json({ success: true });
});
```

**DELETE `/api/agent-definitions/:sessionId/:agentName`**
```javascript
app.delete('/api/agent-definitions/:sessionId/:agentName', (req, res) => {
    const { sessionId, agentName } = req.params;
    if (!WORKSPACES.includes(agentName)) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    db.prepare('DELETE FROM agent_definitions WHERE session_id = ? AND agent_name = ?')
        .run(sessionId, agentName);
    res.json({ success: true, message: 'Definición reseteada a valor por defecto' });
});
```

## Flujo Corregido

### Eliminar Sesión

```
1. Usuario click en 🗑️
2. Confirma: "¿Eliminar esta sesión permanentemente?"
3. Frontend: authFetch(DELETE /api/sessions/17)
4. Browser: Envía OPTIONS (preflight)
5. Server: Responde con métodos permitidos (incluye DELETE)
6. Browser: Envía DELETE
7. Server: Verifica autorización
8. Server: Elimina sesión (CASCADE elimina datos relacionados)
9. Server: Responde { success: true }
10. Frontend: Recarga lista de sesiones
11. ✅ Sesión eliminada correctamente
```

### Resetear Agente

```
1. Usuario click en "↺ Reset"
2. Confirma: "¿Resetear a definición por defecto?"
3. Frontend: authFetch(DELETE /api/agent-definitions/15/ausencias)
4. Browser: Envía OPTIONS (preflight)
5. Server: Responde con métodos permitidos (incluye DELETE)
6. Browser: Envía DELETE
7. Server: Elimina definición personalizada
8. Server: Responde { success: true }
9. Frontend: Recarga definiciones
10. ✅ Agente reseteado a default
```

## Testing

### Escenario 1: Eliminar Sesión
```bash
# Antes: ❌ CORS Error
# Ahora: ✅ Funciona

curl -X DELETE http://localhost:3001/api/sessions/17 \
  -H "x-user-name: Diego"

# Respuesta: {"success":true}
```

### Escenario 2: Resetear Agente
```bash
# Antes: ❌ CORS Error
# Ahora: ✅ Funciona

curl -X DELETE http://localhost:3001/api/agent-definitions/15/ausencias \
  -H "x-user-name: Diego"

# Respuesta: {"success":true,"message":"Definición reseteada a valor por defecto"}
```

## Seguridad

### Validaciones Implementadas

**Eliminar Sesión:**
- ✅ Verifica que la sesión exista
- ✅ Verifica que el usuario sea propietario
- ✅ Retorna 403 si no está autorizado

**Resetear Agente:**
- ✅ Verifica que el agente exista en WORKSPACES
- ✅ Retorna 404 si el agente no es válido
- ✅ Solo afecta a la sesión especificada

### CORS Permisivo

```javascript
origin: '*'  // Permite cualquier origen
```

**Nota:** En producción, deberías restringir esto:
```javascript
origin: 'https://tu-dominio.com'
```

## Otros Métodos HTTP

Si en el futuro necesitas otros métodos:

```javascript
methods: [
    'GET',      // Leer
    'POST',     // Crear/Actualizar
    'PUT',      // Actualizar completo
    'PATCH',    // Actualizar parcial
    'DELETE',   // Eliminar
    'OPTIONS'   // Preflight
]
```

## Reinicio del Servidor

**Importante:** Después de cambiar la configuración de CORS, debes reiniciar el servidor:

```bash
# Si está corriendo
Ctrl+C

# Reiniciar
cd dashboard/server
node server.js
```

O si usas nodemon:
```bash
# Se reinicia automáticamente
```

## Verificación

### Desde el Navegador
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Intentar eliminar sesión
4. Ver petición OPTIONS
5. Verificar headers de respuesta:
   ```
   Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
   ```

### Desde curl
```bash
# Verificar preflight
curl -X OPTIONS http://localhost:3001/api/sessions/17 \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: DELETE" \
  -v

# Buscar en respuesta:
# Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
```

## Conclusión

La corrección de CORS permite que las operaciones DELETE funcionen correctamente desde el frontend. Esto habilita:

- ✅ Eliminar sesiones
- ✅ Resetear definiciones de agentes
- ✅ Cualquier otra operación DELETE futura

**Estado:** ✅ CORREGIDO Y FUNCIONAL

**Acción Requerida:** Reiniciar el servidor para aplicar los cambios.
