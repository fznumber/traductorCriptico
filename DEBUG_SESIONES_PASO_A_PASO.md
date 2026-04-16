# Debug: Problema al Eliminar Sesiones - Paso a Paso

## Síntomas

- Error: "No se pudo eliminar la sesión: Esta sesión pertenece a otro usuario"
- Error 403 (Forbidden)
- Error: "Error al eliminar sesión: Object"

## Debugging Paso a Paso

### Paso 1: Reiniciar Servidor

**IMPORTANTE:** Debes reiniciar el servidor para aplicar los cambios.

```bash
# Terminal 1: Detener servidor actual (Ctrl+C)
cd dashboard/server
node server.js
```

Deberías ver:
```
🚀 SERVER ONLINE
```

### Paso 2: Abrir DevTools en el Navegador

1. Abre el navegador (Chrome/Firefox)
2. Presiona F12 (o Cmd+Option+I en Mac)
3. Ve a la pestaña "Console"
4. Limpia la consola (icono 🚫 o Ctrl+L)

### Paso 3: Hacer Logout

1. En la aplicación, click en "🚪 SALIR"
2. Verifica en la consola del navegador que se limpió el estado

### Paso 4: Hacer Login

1. Selecciona tu usuario (ej: Diego)
2. Observa los logs en la consola del navegador:
   ```
   [LOAD SESSIONS] Cargando sesiones para usuario: Diego
   [LOAD SESSIONS] Sesiones recibidas: [...]
   ```
3. Observa los logs en el servidor:
   ```
   [AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
   [GET SESSIONS] Usuario "Diego" (ID: 1) tiene X sesiones
   ```

### Paso 5: Verificar Sesiones Visibles

En el navegador, abre la consola y ejecuta:

```javascript
// Ver sesiones cargadas
console.log('Sesiones:', sessions);

// Ver usuario actual
console.log('Usuario actual:', currentUser);

// Ver localStorage
console.log('User en localStorage:', localStorage.getItem('tc2026_user'));
```

### Paso 6: Intentar Eliminar Sesión

1. Click en el botón 🗑️ de una sesión
2. Confirma la eliminación
3. Observa los logs en la consola del navegador:
   ```
   [DELETE] Intentando eliminar sesión: X
   [DELETE] Usuario actual: {username: "Diego", id: 1}
   [DELETE] Username en localStorage: Diego
   [DELETE] Respuesta status: 403 o 200
   [DELETE] Respuesta data: {...}
   ```
4. Observa los logs en el servidor:
   ```
   [AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
   [DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión X
   [DELETE SESSION] ✅ o ❌ ...
   ```

## Análisis de Logs

### Caso A: Sesión Pertenece a Otro Usuario

**Logs del Navegador:**
```
[DELETE] Intentando eliminar sesión: 5
[DELETE] Usuario actual: {username: "Diego", id: 1}
[DELETE] Respuesta status: 403
[DELETE] Respuesta data: {error: "No autorizado", message: "Esta sesión pertenece a otro usuario"}
```

**Logs del Servidor:**
```
[AUTH] ✓ Usuario autenticado: "Diego" (ID: 1)
[DELETE SESSION] User "Diego" (ID: 1) intenta eliminar sesión 5
[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "Invitado" (ID: 4)
```

**Diagnóstico:** Estás intentando eliminar una sesión que no te pertenece.

**Solución:** 
1. Verifica qué sesiones deberías ver:
   ```bash
   cd dashboard/server
   node debug_sessions.js | grep Diego
   ```
2. Si ves sesiones de otros usuarios en el panel, hay un problema de sincronización
3. Haz logout y login nuevamente

### Caso B: Header No Se Envía

**Logs del Servidor:**
```
[AUTH] ⚠️ Header x-user-name no proporcionado, usando Invitado por defecto
[GET SESSIONS] Usuario "Desconocido" (ID: 4) tiene X sesiones
```

**Diagnóstico:** El header `x-user-name` no se está enviando.

**Solución:**
1. Verifica en DevTools > Network > Headers que existe `x-user-name`
2. Verifica que `currentUser` no sea null
3. Haz logout y login

### Caso C: Usuario Null

**Logs del Navegador:**
```
[DELETE] Usuario actual: null
```

**Diagnóstico:** El estado `currentUser` es null.

**Solución:**
1. Haz logout
2. Haz login
3. Verifica que `currentUser` se establezca correctamente

## Verificación Manual

### En el Servidor

```bash
# Ver todas las sesiones y sus propietarios
cd dashboard/server
node debug_sessions.js

# Buscar sesiones de un usuario específico
node debug_sessions.js | grep "Diego"
```

### En el Navegador (DevTools > Network)

1. Abre Network tab
2. Filtra por "sessions"
3. Haz una petición (ej: listar sesiones)
4. Click en la petición
5. Ve a "Headers"
6. Verifica:
   ```
   Request Headers:
   x-user-name: Diego
   ```

### En la Base de Datos Directamente

```bash
cd dashboard/server
sqlite3 tc2026.db

# Ver usuarios
SELECT * FROM users;

# Ver sesiones de un usuario
SELECT s.id, s.user_id, u.username, s.input_prompt 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE u.username = 'Diego';

# Salir
.quit
```

## Soluciones Comunes

### Solución 1: Logout y Login

```
1. Click "🚪 SALIR"
2. Selecciona tu usuario
3. Verifica logs
4. Intenta eliminar nuevamente
```

### Solución 2: Limpiar localStorage

```javascript
// En la consola del navegador
localStorage.clear();
location.reload();
```

### Solución 3: Reiniciar Todo

```bash
# Terminal 1: Servidor
Ctrl+C
cd dashboard/server
node server.js

# Terminal 2: Frontend (si aplica)
Ctrl+C
npm run dev

# Navegador
Ctrl+Shift+R (hard refresh)
```

### Solución 4: Verificar Sesión Específica

```bash
cd dashboard/server
sqlite3 tc2026.db "SELECT s.id, s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = 5;"
```

Esto te dirá exactamente a quién pertenece la sesión #5.

## Checklist de Verificación

Antes de intentar eliminar una sesión, verifica:

- [ ] Servidor está corriendo con los últimos cambios
- [ ] Hiciste logout y login
- [ ] Los logs del servidor muestran tu usuario correcto
- [ ] Los logs del navegador muestran tu usuario correcto
- [ ] Las sesiones visibles en el panel son tuyas (según debug_sessions.js)
- [ ] El header `x-user-name` se envía en las peticiones

## Si Todo Falla

### Opción 1: Eliminar Sesión Manualmente

```bash
cd dashboard/server
sqlite3 tc2026.db "DELETE FROM sessions WHERE id = 5;"
```

### Opción 2: Eliminar Todas las Sesiones de Prueba

```bash
cd dashboard/server
sqlite3 tc2026.db "DELETE FROM sessions WHERE id > 1;"
```

### Opción 3: Resetear Base de Datos

```bash
cd dashboard/server
rm tc2026.db tc2026.db-shm tc2026.db-wal
node server.js  # Recreará la BD
```

## Información para Reportar

Si el problema persiste, proporciona:

1. **Logs del navegador** (toda la salida de la consola)
2. **Logs del servidor** (las últimas 20 líneas)
3. **Salida de debug_sessions.js**
4. **Usuario con el que estás logueado**
5. **ID de la sesión que intentas eliminar**
6. **Screenshot del panel de sesiones**

## Próximos Pasos

Una vez que funcione:

1. Verifica que solo veas tus sesiones
2. Verifica que puedas eliminar tus sesiones
3. Verifica que NO puedas eliminar sesiones de otros usuarios (esto es correcto)
4. Prueba con diferentes usuarios

**Estado:** 🔍 EN DEBUGGING CON LOGS MEJORADOS
