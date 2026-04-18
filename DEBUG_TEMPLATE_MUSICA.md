# Debug: Template de Música No Se Aplica

## PROBLEMA REPORTADO
Usuario editó el template a: `"crear una música ambiente alegre y rítmica para este enunciado: {prompt}"`
Pero la música generada no suena como la instrucción.

## VERIFICACIÓN DEL FLUJO

### 1. Verificar que el servidor está actualizado
```bash
cd dashboard/server
# Detener servidor actual (Ctrl+C)
node server.js
```

### 2. Verificar que el template se está guardando

#### En el navegador:
1. Abre las DevTools (F12)
2. Ve a la pestaña "Network"
3. Edita el template de música en el panel de configuración
4. Espera 500ms (debounce)
5. Deberías ver una petición POST a `/api/audio-config`
6. Verifica el payload:
```json
{
  "music_instruction_template": "crear una música ambiente alegre y rítmica para este enunciado: {prompt}",
  "music_device_id": "default",
  "music_pan": 0,
  "music_volume": 1,
  ...
}
```

#### En los logs del servidor:
Deberías ver:
```
[POST AUDIO CONFIG] Sesión X
[POST AUDIO CONFIG] Template recibido: "crear una música ambiente alegre y rítmica para este enunciado: {prompt}"
[POST AUDIO CONFIG] ✅ Actualizado registro existente
[POST AUDIO CONFIG] Template guardado en BD: "crear una música ambiente alegre y rítmica para este enunciado: {prompt}"
```

### 3. Verificar que el template se está usando al generar música

#### Ejecutar un análisis:
1. Escribe un prompt (ej: "analizar el cambio climático")
2. Haz click en "ANALIZAR"
3. Observa los logs del servidor

#### En los logs del servidor deberías ver:
```
[THINKING] Reutilizando sesión X para nuevo análisis
[MUSIC] Buscando template para sesión: X
[MUSIC] Config encontrada: { music_instruction_template: 'crear una música ambiente alegre y rítmica para este enunciado: {prompt}' }
[MUSIC] Template a usar: "crear una música ambiente alegre y rítmica para este enunciado: {prompt}"
[MUSIC] Prompt final generado: "crear una música ambiente alegre y rítmica para este enunciado: analizar el cambio climático"
```

### 4. Verificar en la base de datos directamente

```bash
cd dashboard/server
sqlite3 tc2026.db

# Ver todas las configuraciones de audio
SELECT session_id, music_instruction_template, updated_at 
FROM audio_config 
ORDER BY updated_at DESC 
LIMIT 5;

# Ver configuración de una sesión específica (reemplaza X con tu session_id)
SELECT * FROM audio_config WHERE session_id = X;
```

## POSIBLES CAUSAS Y SOLUCIONES

### Causa 1: Servidor no reiniciado
**Solución**: Reiniciar el servidor backend

### Causa 2: Template no se está guardando
**Síntomas**: No aparece petición POST en Network, o no hay logs en servidor
**Solución**: 
- Verificar que `currentSessionId` no es null
- Verificar que el useEffect se está ejecutando (agregar console.log)

### Causa 3: Template se guarda pero no se usa
**Síntomas**: Logs muestran template guardado pero al generar música usa el template por defecto
**Solución**: 
- Verificar que la sesión es la misma (no se creó nueva sesión)
- Verificar logs de `[MUSIC]` para ver qué template está usando

### Causa 4: ElevenLabs no respeta la instrucción
**Síntomas**: Template correcto en logs pero música no coincide
**Solución**: 
- ElevenLabs Sound Generation puede tener limitaciones en seguir instrucciones complejas
- Probar con instrucciones más simples y directas
- Ejemplos que funcionan mejor:
  - "upbeat electronic music"
  - "calm piano melody"
  - "energetic drums and bass"
  - "ambient nature sounds"

## INSTRUCCIONES RECOMENDADAS PARA ELEVENLABS

ElevenLabs Sound Generation funciona mejor con instrucciones:
- **Cortas y directas** (menos de 100 caracteres)
- **Descriptivas de estilo musical** (no narrativas)
- **En inglés** (mejor soporte)

### Ejemplos de templates efectivos:

❌ MAL (demasiado narrativo):
```
"crear una música ambiente alegre y rítmica para este enunciado: {prompt}"
```

✅ BIEN (descriptivo y directo):
```
"upbeat rhythmic ambient music: {prompt}"
```

✅ BIEN (simple):
```
"cheerful rhythmic background music"
```

✅ BIEN (específico):
```
"energetic electronic beats with ambient pads"
```

## PRUEBA RÁPIDA

1. Cambia el template a: `"upbeat rhythmic ambient music"`
2. Guarda (espera 500ms)
3. Ejecuta análisis
4. Verifica logs del servidor
5. Escucha la música generada

Si con este template simple funciona, el problema es que ElevenLabs no está interpretando bien la instrucción en español o demasiado compleja.

## LOGS ESPERADOS (FLUJO COMPLETO)

```
[POST AUDIO CONFIG] Sesión 5
[POST AUDIO CONFIG] Template recibido: "upbeat rhythmic ambient music"
[POST AUDIO CONFIG] ✅ Actualizado registro existente
[POST AUDIO CONFIG] Template guardado en BD: "upbeat rhythmic ambient music"

[THINKING] Reutilizando sesión 5 para nuevo análisis
[THINKING] Limpiados resultados de agentes anteriores de sesión 5

[MUSIC] Buscando template para sesión: 5
[MUSIC] Config encontrada: { music_instruction_template: 'upbeat rhythmic ambient music' }
[MUSIC] Template a usar: "upbeat rhythmic ambient music"
[MUSIC] Prompt final generado: "upbeat rhythmic ambient music"
[MUSIC] Archivo guardado: fondo_1234567890.mp3
```
