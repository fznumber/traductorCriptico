# Corrección: Carga de Música de Fondo al Cambiar Sesión

## Problema Identificado

Al cambiar de sesión, la música de fondo generada para esa sesión no se estaba cargando automáticamente.

### Síntomas
- Usuario cambia a sesión que tiene música generada
- No se muestra el player de música
- `musicUrl` y `musicPrompt` quedan en `null`
- `musicStatus` queda en `idle`
- Usuario no puede escuchar la música de esa sesión

### Causa Raíz

La función `loadSessionData` estaba cargando:
- ✅ Resultados de agentes
- ✅ Estado de UI (layout de pantallas)
- ✅ Configuración de audio (dispositivos, pan, volumen)
- ❌ **NO cargaba:** URL de música y prompt de música

## Solución Implementada

### 1. Frontend: Actualización de `loadSessionData`

**Antes:**
```typescript
const audioData = await audioRes.json();
if (audioData) {
  setMusicDeviceId(audioData.music_device_id || 'default');
  setMusicPan(audioData.music_pan || 0);
  setMusicVolume(audioData.music_volume || 1);
  setEffectsDeviceId(audioData.effects_device_id || 'default');
  setEffectsPan(audioData.effects_pan || 0);
  setEffectsVolume(audioData.effects_volume || 1);
  // ❌ Faltaba cargar music_url y music_prompt
}
```

**Ahora:**
```typescript
const audioData = await audioRes.json();
if (audioData) {
  // Configuración de dispositivos y volumen
  setMusicDeviceId(audioData.music_device_id || 'default');
  setMusicPan(audioData.music_pan || 0);
  setMusicVolume(audioData.music_volume || 1);
  setEffectsDeviceId(audioData.effects_device_id || 'default');
  setEffectsPan(audioData.effects_pan || 0);
  setEffectsVolume(audioData.effects_volume || 1);
  
  // ✅ Música generada para esta sesión
  if (audioData.music_url) {
    setMusicUrl(audioData.music_url);
    setMusicPrompt(audioData.music_prompt || null);
    setMusicStatus('ready');
  } else {
    setMusicUrl(null);
    setMusicPrompt(null);
    setMusicStatus('idle');
  }
}
```

### 2. Backend: Mejora de Valores por Defecto

**Antes:**
```javascript
res.json(config || { 
  music_device_id: 'default', music_pan: 0, music_volume: 1,
  effects_device_id: 'default', effects_pan: 0, effects_volume: 1
  // ❌ No incluía music_url y music_prompt
});
```

**Ahora:**
```javascript
res.json(config || { 
  music_device_id: 'default', music_pan: 0, music_volume: 1,
  effects_device_id: 'default', effects_pan: 0, effects_volume: 1,
  music_url: null, music_prompt: null  // ✅ Incluye campos de música
});
```

## Flujo Corregido

### Al Cambiar de Sesión

```
1. Usuario click en Sesión #15
2. switchSession() se ejecuta
3. Resetea estado:
   - musicUrl → null
   - musicPrompt → null
   - musicStatus → 'idle'
4. loadSessionData() se ejecuta
5. Carga audio_config de la sesión
6. Si tiene music_url:
   - setMusicUrl(audioData.music_url)
   - setMusicPrompt(audioData.music_prompt)
   - setMusicStatus('ready')
7. Player de música aparece
8. Usuario puede reproducir la música
```

### Casos de Uso

#### Caso 1: Sesión con Música Generada
```
Sesión #10:
├── music_url: "/audio/fondo_1776228530401.mp3"
├── music_prompt: "Cinematic dark ambient for: El Estado..."
└── music_status: 'ready'

Resultado: ✅ Player aparece con música lista
```

#### Caso 2: Sesión sin Música
```
Sesión #12:
├── music_url: null
├── music_prompt: null
└── music_status: 'idle'

Resultado: ✅ No aparece player (correcto)
```

#### Caso 3: Sesión Nueva
```
Sesión #15 (recién creada):
├── music_url: null
├── music_prompt: null
└── music_status: 'idle'

Resultado: ✅ No aparece player hasta generar música
```

## Estructura de Datos

### Tabla `audio_config`
```sql
CREATE TABLE audio_config (
    id INTEGER PRIMARY KEY,
    session_id INTEGER,
    music_prompt TEXT,           -- ← Prompt usado para generar
    music_url TEXT,              -- ← URL del archivo MP3
    music_device_id TEXT,        -- Dispositivo de salida
    music_pan REAL,              -- Paneo L/R
    music_volume REAL,           -- Volumen
    effects_device_id TEXT,      -- Dispositivo efectos
    effects_pan REAL,            -- Paneo efectos
    effects_volume REAL,         -- Volumen efectos
    ...
)
```

### Respuesta del Endpoint
```json
{
  "music_url": "/audio/fondo_1776228530401.mp3",
  "music_prompt": "Cinematic dark ambient for: El Estado garantiza seguridad",
  "music_device_id": "default",
  "music_pan": 0,
  "music_volume": 1,
  "effects_device_id": "default",
  "effects_pan": 0,
  "effects_volume": 1
}
```

## Componentes Afectados

### Frontend (`App.tsx`)
- ✅ `loadSessionData()` - Ahora carga música
- ✅ `switchSession()` - Ya reseteaba correctamente
- ✅ Estado de música se actualiza correctamente

### Backend (`server.js`)
- ✅ `GET /api/audio-config` - Incluye campos de música en defaults
- ✅ Respuesta consistente con o sin datos

## Testing

### Escenario 1: Cambiar a Sesión con Música
```
1. Crear Sesión A con análisis
2. Generar música para Sesión A
3. Crear Sesión B
4. Cambiar a Sesión A
5. ✅ Verificar: Player aparece con música de Sesión A
```

### Escenario 2: Cambiar a Sesión sin Música
```
1. Crear Sesión C sin música
2. Cambiar a Sesión C
3. ✅ Verificar: No aparece player
```

### Escenario 3: Múltiples Cambios
```
1. Sesión A tiene música X
2. Sesión B tiene música Y
3. Cambiar A → B
4. ✅ Verificar: Música cambia de X a Y
5. Cambiar B → A
6. ✅ Verificar: Música cambia de Y a X
```

## Beneficios

1. **Consistencia:** Cada sesión mantiene su música
2. **Experiencia:** Usuario recupera el ambiente sonoro de cada análisis
3. **Contexto:** La música ayuda a recordar el contexto del análisis
4. **Completitud:** Toda la configuración de audio se carga correctamente

## Notas Técnicas

### Orden de Carga
```
1. Resetear estado (null/idle)
2. Cargar configuración de BD
3. Aplicar configuración al estado
4. React re-renderiza con nueva configuración
5. Player aparece/desaparece según corresponda
```

### Condicional de Música
```typescript
if (audioData.music_url) {
  // Hay música generada
  setMusicStatus('ready');
} else {
  // No hay música
  setMusicStatus('idle');
}
```

### Player Condicional
```typescript
{musicStatus !== 'idle' && (
  <div className="music-bar">
    {/* Player solo aparece si hay música */}
  </div>
)}
```

## Mejoras Futuras

1. **Preload:** Precargar música de sesiones recientes
2. **Cache:** Cachear archivos de audio en el navegador
3. **Transición:** Fade in/out al cambiar música
4. **Playlist:** Cola de reproducción de múltiples sesiones
5. **Visualización:** Indicador de qué sesiones tienen música

## Conclusión

La corrección asegura que al cambiar de sesión, toda la configuración de audio se carga correctamente, incluyendo la música de fondo generada. Esto mejora significativamente la experiencia de usuario al recuperar el contexto sonoro completo de cada análisis.

**Estado:** ✅ CORREGIDO Y FUNCIONAL
