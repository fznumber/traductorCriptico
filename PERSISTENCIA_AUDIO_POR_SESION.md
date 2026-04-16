# Persistencia de Configuración de Audio por Sesión

## Resumen
Se ha implementado la persistencia completa de la configuración de audio por sesión, permitiendo que cada sesión mantenga su propia configuración de dispositivos, paneo y volumen tanto para música como para efectos.

## Cambios en la Base de Datos (`dashboard/server/db.js`)

### Nuevas Columnas en `audio_config`

```sql
music_device_id TEXT DEFAULT 'default'    -- Dispositivo de salida para música
music_pan REAL DEFAULT 0                  -- Paneo L/R para música (-1 a 1)
music_volume REAL DEFAULT 1               -- Volumen para música (0 a 1)
effects_device_id TEXT DEFAULT 'default'  -- Dispositivo de salida para efectos
effects_pan REAL DEFAULT 0                -- Paneo L/R para efectos (-1 a 1)
effects_volume REAL DEFAULT 1             -- Volumen para efectos (0 a 1)
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Timestamp de última actualización
```

### Migración Automática

El código incluye una función `addColumnIfNotExists` que agrega las columnas nuevas a bases de datos existentes sin perder datos:

```javascript
addColumnIfNotExists('audio_config', 'music_device_id', 'TEXT', "'default'");
addColumnIfNotExists('audio_config', 'music_pan', 'REAL', '0');
// ... etc
```

Esto permite actualizar el sistema sin necesidad de recrear la base de datos.

## Cambios en el Backend (`dashboard/server/server.js`)

### Nuevos Endpoints

#### GET `/api/audio-config`
**Descripción:** Obtiene la configuración de audio de la sesión actual

**Respuesta:**
```json
{
  "music_device_id": "default",
  "music_pan": 0,
  "music_volume": 1,
  "effects_device_id": "default",
  "effects_pan": 0,
  "effects_volume": 1
}
```

**Comportamiento:**
- Si no hay sesión activa, retorna valores por defecto
- Si no hay configuración guardada, retorna valores por defecto
- Si existe configuración, retorna los valores guardados

#### POST `/api/audio-config`
**Descripción:** Guarda la configuración de audio de la sesión actual

**Body:**
```json
{
  "music_device_id": "device-id-123",
  "music_pan": -0.5,
  "music_volume": 0.8,
  "effects_device_id": "device-id-456",
  "effects_pan": 0.3,
  "effects_volume": 0.9
}
```

**Comportamiento:**
- Si ya existe configuración para la sesión: UPDATE
- Si no existe: INSERT
- Actualiza el campo `updated_at` automáticamente

## Cambios en el Frontend (`dashboard/client/src/App.tsx`)

### Función `loadSessionData` Actualizada

Ahora carga también la configuración de audio:

```typescript
const audioRes = await fetch(`${API_BASE}/audio-config?sessionId=${sessionId}`, {
  headers: { 'x-user-name': username }
});
const audioData = await audioRes.json();
if (audioData) {
  setMusicDeviceId(audioData.music_device_id || 'default');
  setMusicPan(audioData.music_pan || 0);
  setMusicVolume(audioData.music_volume || 1);
  setEffectsDeviceId(audioData.effects_device_id || 'default');
  setEffectsPan(audioData.effects_pan || 0);
  setEffectsVolume(audioData.effects_volume || 1);
}
```

### Nueva Función `saveAudioConfig`

Guarda la configuración actual en el backend:

```typescript
const saveAudioConfig = async () => {
  if (!currentSessionId) return;
  await authFetch(`${API_BASE}/audio-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      music_device_id: musicDeviceId,
      music_pan: musicPan,
      music_volume: musicVolume,
      effects_device_id: effectsDeviceId,
      effects_pan: effectsPan,
      effects_volume: effectsVolume
    })
  });
};
```

### Auto-guardado con Debounce

Se agregó un `useEffect` que guarda automáticamente la configuración cuando cambia:

```typescript
useEffect(() => {
  if (currentSessionId) {
    const timeoutId = setTimeout(() => {
      saveAudioConfig();
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timeoutId);
  }
}, [musicDeviceId, musicPan, musicVolume, effectsDeviceId, effectsPan, effectsVolume, currentSessionId]);
```

**Características del auto-guardado:**
- Debounce de 500ms para evitar múltiples guardados
- Solo guarda si hay una sesión activa
- Se ejecuta cada vez que cambia cualquier parámetro de audio

### Función `switchSession` Actualizada

Ahora resetea la configuración de audio antes de cargar la nueva sesión:

```typescript
// Resetear configuración de audio a valores por defecto antes de cargar
setMusicDeviceId('default');
setMusicPan(0);
setMusicVolume(1);
setEffectsDeviceId('default');
setEffectsPan(0);
setEffectsVolume(1);
await loadSessionData(sessionId, currentUser.username);
```

Esto evita que se vea brevemente la configuración de la sesión anterior.

## Flujo de Uso

### Escenario 1: Configurar Audio en una Sesión

1. Usuario ajusta dispositivo de música a "Speakers"
2. Usuario ajusta paneo a -0.5 (izquierda)
3. Usuario ajusta volumen a 0.7
4. **Auto-guardado:** Después de 500ms sin cambios, se guarda automáticamente
5. La configuración queda asociada a la sesión actual

### Escenario 2: Cambiar de Sesión

1. Usuario tiene Sesión #10 con configuración personalizada
2. Usuario cambia a Sesión #15
3. **Reset:** Configuración se resetea a valores por defecto
4. **Carga:** Se carga la configuración guardada de Sesión #15
5. Si Sesión #15 no tiene configuración guardada, usa valores por defecto

### Escenario 3: Crear Nueva Sesión

1. Usuario crea nueva sesión
2. Configuración inicia con valores por defecto
3. Usuario ajusta configuración
4. Se guarda automáticamente para esa nueva sesión

### Escenario 4: Recuperar Sesión Antigua

1. Usuario hace login
2. Se carga la última sesión
3. Se recupera su configuración de audio guardada
4. Todo funciona exactamente como cuando se dejó

## Valores por Defecto

```javascript
{
  music_device_id: 'default',      // Dispositivo por defecto del sistema
  music_pan: 0,                    // Centro (sin paneo)
  music_volume: 1,                 // Volumen máximo
  effects_device_id: 'default',    // Dispositivo por defecto del sistema
  effects_pan: 0,                  // Centro (sin paneo)
  effects_volume: 1                // Volumen máximo
}
```

## Compatibilidad

### Bases de Datos Existentes
- ✓ Migración automática de columnas
- ✓ No se pierden datos existentes
- ✓ Valores por defecto para registros antiguos

### Sesiones Antiguas
- ✓ Sesiones sin configuración usan valores por defecto
- ✓ Primera vez que se ajusta, se crea el registro
- ✓ Totalmente retrocompatible

## Beneficios

1. **Aislamiento:** Cada sesión tiene su propia configuración de audio
2. **Persistencia:** La configuración sobrevive a reinicios del navegador
3. **Flexibilidad:** Diferentes análisis pueden tener diferentes configuraciones
4. **Usabilidad:** Auto-guardado transparente sin intervención del usuario
5. **Performance:** Debounce evita guardados excesivos

## Casos de Uso

### Análisis con Diferentes Ambientes Sonoros

**Sesión #1: "Análisis de discurso político"**
- Música: Dispositivo "Speakers", Volumen 0.3, Pan centro
- Efectos: Dispositivo "Headphones", Volumen 0.8, Pan izquierda

**Sesión #2: "Análisis de texto filosófico"**
- Música: Dispositivo "Headphones", Volumen 0.6, Pan derecha
- Efectos: Dispositivo "Headphones", Volumen 0.5, Pan centro

Cada sesión mantiene su configuración independiente.

### Presentaciones Multi-Pantalla

**Sesión de Demostración:**
- Música: Dispositivo "HDMI Audio", Volumen 0.4
- Efectos: Dispositivo "Internal Speakers", Volumen 0.9

La configuración se mantiene al volver a esta sesión para futuras demos.

## Notas Técnicas

- El debounce de 500ms es configurable
- El campo `updated_at` permite tracking de cambios
- La tabla usa `ON DELETE CASCADE` para limpieza automática
- Los device IDs son strings para soportar cualquier dispositivo
- Pan y volumen son REAL para precisión decimal
