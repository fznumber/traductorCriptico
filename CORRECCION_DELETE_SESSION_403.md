# Corrección: Error 403 al Eliminar Sesiones

## Problema Identificado

Al intentar eliminar una sesión, se produce un error 403 (Forbidden):

```
DELETE http://localhost:3001/api/sessions/5 403 (Forbidden)
```

### Causas Posibles

1. **Usuario incorrecto:** Intentas eliminar una sesión que pertenece a otro usuario
2. **Header faltante:** El header `x-user-name` no se envía correctamente
3. **Body en DELETE:** La función `authFetch` procesaba incorrectamente peticiones DELETE

## Soluciones Implementadas

### 1. Corrección de `authFetch`

**Problema:** La función intentaba parsear y modificar el body incluso en peticiones DELETE.

**Antes:**
```typescript
const authFetch = (url: string, options: any = {}) => {
  const headers = { ...options.headers, 'x-user-name': currentUser?.username || ... };
  const body = options.body ? JSON.parse(options.body) : {};  // ❌ Siempre parseaba
  if (currentSessionId && !body.sessionId) {
    body.sessionId = currentSessionId;  // ❌ Agregaba sessionId a DELETE
  }
  return fetch(url, { ...options, headers, body: JSON.stringify(body) });
};
```

**Ahora:**
```typescript
const authFetch = (url: string, options: any = {}) => {
  const headers = { ...options.headers, 'x-user-name': currentUser?.username || ... };
  
  // ✅ Solo procesar body si existe y no es DELETE
  let finalBody = options.body;
  if (options.body && options.method !== 'DELETE') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    if (currentSessionId && !body.sessionId) {
      body.sessionId = currentSessionId;
    }
    finalBody = JSON.stringify(body);
  }
  
  return fetch(url, { ...options, headers, body: finalBody });
};
```

### 2. Mejora de Mensajes de Error en Backend

**Antes:**
```javascript
if (!session || session.user_id !== userId) {
  return res.status(403).json({ error: 'No autorizado' });
}
```

**Ahora:**
```javascript
if (!session) {
  console.log(`[DELETE SESSION] Sesión ${sessionId} no encontrada`);
  return res.status(404).json({ error: 'Sesión no encontrada' });
}

if (session.user_id !== userId) {
  const sessionOwner = db.prepare('SELECT username FROM users WHERE id = ?').get(session.user_id);
  console.log(`[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "${sessionOwner?.username}"`);
  return res.status(403).json({ 
    error: 'No autorizado', 
    message: `Esta sesión pertenece a otro usuario` 
  });
}
```

### 3. Mejor Manejo de Errores en Frontend

**Antes:**
```typescript
try {
  await authFetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  // ... continúa sin verificar respuesta
} catch (e) {
  console.error('Error deleting session', e);
}
```

**Ahora:**
```typescript
try {
  const res = await authFetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  const data = await res.json();
  
  if (!res.ok) {
    console.error('Error al eliminar sesión:', data);
    addLog(`>> ❌ Error: ${data.message || data.error}`);
    alert(`No se pudo eliminar la sesión: ${data.message || data.error}`);
    return;
  }
  
  // ... continúa solo si fue exitoso
  addLog(`>> ✅ Sesión ${sessionId} eliminada`);
} catch (e: any) {
  console.error('Error deleting session', e);
  addLog(`>> ❌ Error al eliminar sesión: ${e.message}`);
  alert(`Error al eliminar sesión: ${e.message}`);
}
```

## Verificación de Autorización

### Flujo de Autorización

```
1. Frontend envía DELETE con header 'x-user-name'
2. Backend extrae userId del header
3. Backend busca la sesión en BD
4. Backend compara session.user_id con userId
5. Si coinciden: ✅ Elimina
6. Si no coinciden: ❌ 403 Forbidden
```

### Ejemplo de Log del Servidor

```
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 5
[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "Invitado" (ID: 4)
```

## Script de Debug

Se creó un script para verificar qué sesiones pertenecen a qué usuarios:

```bash
cd dashboard/server
node debug_sessions.js
```

**Salida:**
```
📊 USUARIOS:
────────────────────────────────────────────────────────────
ID: 1 | Username: Diego
ID: 2 | Username: Claudia
ID: 3 | Username: Ariel
ID: 4 | Username: Invitado

📋 SESIONES:
────────────────────────────────────────────────────────────
Session #16 | User ID: 1 (Diego) | Prompt: Nueva sesión...
Session #15 | User ID: 1 (Diego) | Prompt: que es un monad...
Session #5 | User ID: 4 (Invitado) | Prompt: el estado garantiza...
...
```

## Casos de Uso

### Caso 1: Eliminar Sesión Propia ✅

```
Usuario: Diego (ID: 1)
Sesión: #16 (pertenece a Diego)

Resultado: ✅ Sesión eliminada exitosamente
```

### Caso 2: Intentar Eliminar Sesión Ajena ❌

```
Usuario: Diego (ID: 1)
Sesión: #5 (pertenece a Invitado, ID: 4)

Resultado: ❌ 403 Forbidden
Mensaje: "Esta sesión pertenece a otro usuario"
```

### Caso 3: Sesión No Existe ❌

```
Usuario: Diego (ID: 1)
Sesión: #999 (no existe)

Resultado: ❌ 404 Not Found
Mensaje: "Sesión no encontrada"
```

## Solución al Error Específico

Si ves el error:
```
DELETE http://localhost:3001/api/sessions/5 403 (Forbidden)
```

**Verifica:**

1. **¿Eres el propietario de la sesión?**
   ```bash
   cd dashboard/server
   node debug_sessions.js
   # Busca la sesión #5 y verifica el User ID
   ```

2. **¿Estás logueado como el usuario correcto?**
   - Verifica en el header del dashboard: "TC2026 / DIEGO"
   - Si no coincide, haz logout y login con el usuario correcto

3. **¿El servidor está actualizado?**
   - Reinicia el servidor para aplicar los cambios
   - Verifica los logs del servidor al intentar eliminar

## Prevención

### En el Frontend

El endpoint `/api/sessions` ya filtra por usuario:
```javascript
WHERE user_id = ?
```

Esto significa que solo deberías ver tus propias sesiones en la lista. Si ves sesiones de otros usuarios, hay un problema con el estado del frontend.

### Solución: Logout y Login

Si ves sesiones que no te pertenecen:
```
1. Click en "🚪 SALIR"
2. Selecciona tu usuario nuevamente
3. Verifica que solo veas tus sesiones
```

## Testing

### Test 1: Eliminar Sesión Propia
```bash
# Como Diego (user_id: 1)
curl -X DELETE http://localhost:3001/api/sessions/16 \
  -H "x-user-name: Diego"

# Esperado: {"success":true}
```

### Test 2: Intentar Eliminar Sesión Ajena
```bash
# Como Diego (user_id: 1) intentando eliminar sesión de Invitado
curl -X DELETE http://localhost:3001/api/sessions/5 \
  -H "x-user-name: Diego"

# Esperado: 403 {"error":"No autorizado","message":"Esta sesión pertenece a otro usuario"}
```

### Test 3: Sesión No Existe
```bash
curl -X DELETE http://localhost:3001/api/sessions/999 \
  -H "x-user-name: Diego"

# Esperado: 404 {"error":"Sesión no encontrada"}
```

## Logs del Servidor

Con los cambios implementados, verás logs claros:

```
✅ Éxito:
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 16
[DELETE SESSION] ✅ Sesión 16 eliminada exitosamente por "Diego"

❌ No autorizado:
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 5
[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "Invitado" (ID: 4)

❌ No encontrada:
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 999
[DELETE SESSION] Sesión 999 no encontrada
```

## Conclusión

El error 403 ocurre cuando intentas eliminar una sesión que no te pertenece. Las mejoras implementadas:

1. ✅ Corrigen el manejo de peticiones DELETE en `authFetch`
2. ✅ Mejoran los mensajes de error para debugging
3. ✅ Agregan logs detallados en el servidor
4. ✅ Muestran alertas claras al usuario

**Acción Requerida:** 
- Reiniciar el servidor
- Verificar que estás logueado como el usuario correcto
- Solo intentar eliminar tus propias sesiones

**Estado:** ✅ CORREGIDO Y MEJORADO
