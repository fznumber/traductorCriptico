# Solución: "Esta sesión pertenece a otro usuario"

## Problema

Ves el error: **"No se pudo eliminar la sesión: Esta sesión pertenece a otro usuario"**

## ¿Por qué ocurre?

Estás viendo sesiones que no te pertenecen en el panel de sesiones. Esto puede pasar por dos razones:

### Razón 1: Estado Inconsistente del Frontend

El frontend tiene cargadas sesiones de un usuario anterior y no se actualizó al cambiar de usuario.

### Razón 2: Header `x-user-name` No Se Envía Correctamente

Si el header no se envía en algunas peticiones, el servidor usa "Invitado" por defecto, causando inconsistencias.

## Verificación

### 1. ¿Qué usuario eres?

Mira el header del dashboard:
```
TC2026 / DIEGO  ← Este es tu usuario actual
```

### 2. ¿Qué sesiones tienes?

Ejecuta el script de debug:
```bash
cd dashboard/server
node debug_sessions.js
```

Busca tus sesiones:
```
Session #16 | User ID: 1 (Diego) | Prompt: Nueva sesión...
Session #15 | User ID: 1 (Diego) | Prompt: que es un monad...
Session #14 | User ID: 1 (Diego) | Prompt: Nueva sesión...
Session #13 | User ID: 1 (Diego) | Prompt: cual es el estado...
```

### 3. ¿Qué sesiones ves en el panel?

Si ves sesiones que NO aparecen en tu lista del script, hay un problema.

## Solución Rápida

### Paso 1: Logout y Login

1. Click en "🚪 SALIR"
2. Selecciona tu usuario nuevamente
3. Verifica que solo veas tus sesiones

### Paso 2: Reiniciar Servidor

```bash
# Detener servidor (Ctrl+C)
cd dashboard/server
node server.js
```

### Paso 3: Refrescar Frontend

```bash
# En el navegador
Ctrl+Shift+R  (o Cmd+Shift+R en Mac)
```

## Logs del Servidor

Con los cambios implementados, ahora verás logs claros:

### Al Listar Sesiones
```
[AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
[GET SESSIONS] Usuario "Diego" (ID: 1) tiene 4 sesiones
```

### Al Intentar Eliminar
```
[AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 5
[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "Invitado" (ID: 4)
```

## Ejemplo de Problema Real

### Escenario

1. Estás logueado como "Diego" (user_id: 1)
2. El panel muestra sesiones #5, #6, #7 (que pertenecen a "Invitado", user_id: 4)
3. Intentas eliminar sesión #5
4. Error: "Esta sesión pertenece a otro usuario"

### ¿Por qué pasa?

El endpoint `/api/sessions` debería devolver solo sesiones de Diego, pero está devolviendo sesiones de Invitado. Esto significa que:

- El header `x-user-name` no se está enviando correctamente
- O el estado del frontend está desincronizado

### Solución

```
1. Logout
2. Login como Diego
3. Verificar en logs del servidor:
   [AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
   [GET SESSIONS] Usuario "Diego" (ID: 1) tiene 4 sesiones
4. Ahora solo verás sesiones de Diego
5. Podrás eliminar tus propias sesiones
```

## Verificación de Headers

### En el Navegador (DevTools)

1. Abre DevTools (F12)
2. Ve a Network tab
3. Haz una petición (ej: listar sesiones)
4. Click en la petición
5. Ve a "Request Headers"
6. Verifica que existe:
   ```
   x-user-name: Diego
   ```

### Si el Header No Está

Hay un problema en el frontend. Verifica:

```typescript
// En App.tsx
const authFetch = (url: string, options: any = {}) => {
  const headers = {
    ...options.headers,
    'x-user-name': currentUser?.username || localStorage.getItem('tc2026_user') || ''
  };
  // ...
};
```

## Casos de Uso Correctos

### Caso 1: Diego Elimina Su Sesión ✅

```
Usuario logueado: Diego (ID: 1)
Sesiones visibles: #13, #14, #15, #16 (todas de Diego)
Intenta eliminar: #16
Resultado: ✅ Eliminada exitosamente
```

### Caso 2: Diego Ve Sesiones de Invitado ❌

```
Usuario logueado: Diego (ID: 1)
Sesiones visibles: #5, #6, #7 (de Invitado, ID: 4)
Intenta eliminar: #5
Resultado: ❌ "Esta sesión pertenece a otro usuario"

Problema: El panel está mostrando sesiones incorrectas
Solución: Logout y Login
```

### Caso 3: Invitado Elimina Su Sesión ✅

```
Usuario logueado: Invitado (ID: 4)
Sesiones visibles: #4, #5, #6, #7 (todas de Invitado)
Intenta eliminar: #5
Resultado: ✅ Eliminada exitosamente
```

## Prevención

### En el Frontend

Asegúrate de que `currentUser` esté siempre actualizado:

```typescript
// Al hacer login
setCurrentUser(data.user);
localStorage.setItem('tc2026_user', username);

// Al hacer logout
setCurrentUser(null);
localStorage.removeItem('tc2026_user');
```

### En el Backend

Los logs ahora te ayudarán a detectar problemas:

```
⚠️ Si ves:
[AUTH] ⚠️ Header x-user-name no proporcionado, usando Invitado por defecto

→ Hay un problema en el frontend, el header no se está enviando
```

## Testing Manual

### Test 1: Verificar Usuario Actual

```javascript
// En la consola del navegador
console.log(localStorage.getItem('tc2026_user'));
// Debería mostrar: "Diego" (o tu usuario actual)
```

### Test 2: Verificar Sesiones

```bash
# En el servidor
cd dashboard/server
node debug_sessions.js | grep "User ID: 1"
# Muestra solo sesiones de Diego (user_id: 1)
```

### Test 3: Verificar Headers

```bash
# Desde curl
curl http://localhost:3001/api/sessions \
  -H "x-user-name: Diego" \
  -v

# Verifica que el servidor responda con sesiones de Diego
```

## Resumen

El error **"Esta sesión pertenece a otro usuario"** es correcto y esperado cuando intentas eliminar una sesión que no te pertenece.

**El problema real es:** ¿Por qué estás viendo sesiones de otros usuarios?

**Solución:**
1. Logout y Login
2. Reiniciar servidor
3. Verificar logs
4. Solo deberías ver tus propias sesiones

**Prevención:**
- Los logs del servidor ahora te alertarán si hay problemas con headers
- El sistema es más estricto con la autenticación

**Estado:** ✅ MEJORADO CON LOGS Y VALIDACIONES
