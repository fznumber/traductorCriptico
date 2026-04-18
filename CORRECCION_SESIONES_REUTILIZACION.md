# Corrección: Reutilización de Sesiones en Análisis

## PROBLEMA IDENTIFICADO

Al hacer click en "ANALIZAR", la aplicación creaba una NUEVA sesión, pero las configuraciones personalizadas (agentes, música, audio config) estaban asociadas a la sesión ANTERIOR.

### Flujo Problemático:
1. Usuario está en sesión #5 con agentes personalizados y template de música personalizado
2. Usuario hace click en "ANALIZAR"
3. Backend crea sesión #6 (nueva)
4. Agentes se ejecutan en sesión #6 pero usan definiciones por defecto (no las personalizadas de sesión #5)
5. Música se genera para sesión #6 sin el template personalizado de sesión #5

### Causa Raíz:
- Frontend `runPipeline()` no enviaba el `currentSessionId` al backend
- Backend `/api/generate-thinking` SIEMPRE creaba nueva sesión con `INSERT INTO sessions`

## SOLUCIÓN IMPLEMENTADA

### 1. Frontend: Enviar sessionId actual
**Archivo**: `dashboard/client/src/App.tsx`

```typescript
const genRes = await authFetch(`${API_BASE}/generate-thinking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt,
    sessionId: currentSessionId // Enviar sessionId actual si existe
  })
});
```

### 2. Backend: Reutilizar sesión existente
**Archivo**: `dashboard/server/server.js`

```javascript
app.post('/api/generate-thinking', async (req, res) => {
    const { prompt, sessionId } = req.body;
    const uid = getUserIdFromHeaders(req);
    
    let sid;
    if (sessionId) {
        // Reutilizar sesión existente y actualizar el prompt
        console.log(`[THINKING] Reutilizando sesión ${sessionId} para nuevo análisis`);
        
        // Limpiar resultados de agentes anteriores
        db.prepare('DELETE FROM agent_logs WHERE session_id = ?').run(sessionId);
        console.log(`[THINKING] Limpiados resultados de agentes anteriores de sesión ${sessionId}`);
        
        // Actualizar prompt y limpiar thinking anterior
        db.prepare('UPDATE sessions SET input_prompt = ?, thinking = NULL WHERE id = ?').run(prompt, sessionId);
        sid = sessionId;
    } else {
        // Crear nueva sesión
        console.log(`[THINKING] Creando nueva sesión para análisis`);
        sid = db.prepare('INSERT INTO sessions (user_id, input_prompt) VALUES (?, ?)').run(uid, prompt).lastInsertRowid;
    }
    
    res.json({ success: true, sessionId: sid });
    // ... resto del código de generación de thinking
});
```

## COMPORTAMIENTO NUEVO

### Caso 1: Usuario con sesión activa
1. Usuario está en sesión #5 con configuraciones personalizadas
2. Usuario hace click en "ANALIZAR"
3. Backend REUTILIZA sesión #5:
   - Limpia resultados de agentes anteriores (`DELETE FROM agent_logs`)
   - Actualiza prompt y limpia thinking anterior
4. Agentes se ejecutan en sesión #5 usando las definiciones personalizadas
5. Música se genera con el template personalizado de sesión #5

### Caso 2: Usuario sin sesión activa
1. Usuario nuevo o sin sesión seleccionada
2. Usuario hace click en "ANALIZAR"
3. Backend CREA nueva sesión
4. Agentes usan definiciones por defecto
5. Música usa template por defecto

## VENTAJAS

1. **Consistencia**: Las configuraciones personalizadas se mantienen entre análisis
2. **Simplicidad**: No es necesario copiar configuraciones entre sesiones
3. **Historial limpio**: Cada análisis nuevo limpia los resultados anteriores de la misma sesión
4. **Flexibilidad**: Usuario puede crear nueva sesión manualmente si lo desea
5. **Configuraciones persistentes**: Los agentes personalizados y templates de música se mantienen en la sesión

## LOGS DE DEBUGGING

El backend ahora muestra logs claros:
```
[THINKING] Reutilizando sesión 5 para nuevo análisis
[THINKING] Limpiados resultados de agentes anteriores de sesión 5
[MUSIC] Buscando template para sesión: 5
[MUSIC] Config encontrada: { music_instruction_template: 'musica alegre y ritmica : {prompt}' }
[MUSIC] Template a usar: "musica alegre y ritmica : {prompt}"
[MUSIC] Prompt final generado: "musica alegre y ritmica : analizar el impacto del cambio climático"
```

## INSTRUCCIONES DE PRUEBA

### 1. Reiniciar el servidor backend
```bash
cd dashboard/server
# Detener el servidor actual (Ctrl+C)
node server.js
```

### 2. Probar el flujo completo

#### Paso 1: Personalizar configuraciones
1. Iniciar sesión con un usuario
2. En el panel de configuración de audio, cambiar el template de música a: `"musica alegre y ritmica : {prompt}"`
3. Guardar la configuración
4. Opcionalmente, personalizar algún agente en el panel de configuración

#### Paso 2: Ejecutar análisis
1. Escribir un prompt en el campo de texto (ej: "analizar el impacto del cambio climático")
2. Hacer click en "ANALIZAR"
3. Observar los logs del servidor backend

#### Paso 3: Verificar resultados
En los logs del servidor deberías ver:
```
[THINKING] Reutilizando sesión X para nuevo análisis
[THINKING] Limpiados resultados de agentes anteriores de sesión X
[MUSIC] Template a usar: "musica alegre y ritmica : {prompt}"
[MUSIC] Prompt final generado: "musica alegre y ritmica : analizar el impacto del cambio climático"
```

#### Paso 4: Verificar música generada
1. Esperar a que se genere la música
2. Reproducir el audio
3. Confirmar que el estilo de música coincide con el template personalizado

### 3. Probar caso de nueva sesión

1. Hacer click en "Nueva Sesión" en el panel lateral
2. Escribir un prompt y hacer click en "ANALIZAR"
3. Verificar en logs que se crea una nueva sesión:
```
[THINKING] Creando nueva sesión para análisis
```

## ARCHIVOS MODIFICADOS

- `dashboard/client/src/App.tsx`: Función `runPipeline()` línea ~630
- `dashboard/server/server.js`: Endpoint `/api/generate-thinking` línea ~275

## NOTAS ADICIONALES

- Las fases 2 y 3 ya usaban `currentSessionId` correctamente, no requirieron cambios
- La tabla `agent_definitions` almacena las definiciones personalizadas por sesión
- La tabla `audio_config` almacena la configuración de audio por sesión
- Ambas tablas usan `session_id` como clave foránea con `ON DELETE CASCADE`

