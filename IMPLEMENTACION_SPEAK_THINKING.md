# Implementación: Escuchar Thinking (Text-to-Speech)

## PROBLEMA
El botón "Escuchar Thinking" generaba error 404 porque el endpoint `/api/speak-thinking` no existía.

## SOLUCIÓN IMPLEMENTADA

### 1. Nuevo Endpoint Backend
**Archivo**: `dashboard/server/server.js`

```javascript
app.post('/api/speak-thinking', async (req, res) => {
    const { text } = req.body;
    const sid = getEffectiveSessionId(req);
    const API_KEY = process.env.ELEVENLABS_API_KEY;
    
    // Validaciones
    if (!API_KEY || API_KEY.includes('tu_')) {
        return res.json({ success: false, error: 'API Key de ElevenLabs no configurada' });
    }
    
    if (!text) {
        return res.json({ success: false, error: 'No se proporcionó texto' });
    }

    try {
        // Obtener voice_id de configuración o usar por defecto
        const audioConfig = db.prepare('SELECT voice_id FROM audio_config WHERE session_id = ?').get(sid);
        const voiceId = audioConfig?.voice_id || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
        
        // Limpiar texto (remover tags XML)
        const cleanText = text.replace(/<think>|<\/think>/g, '').trim();
        
        // Limitar longitud (ElevenLabs tiene límites)
        const maxLength = 5000;
        const textToSpeak = cleanText.length > maxLength 
            ? cleanText.substring(0, maxLength) + '...' 
            : cleanText;
        
        // Llamar a ElevenLabs TTS API
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 
                'xi-api-key': API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                text: textToSpeak,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });
        
        // Guardar archivo de audio
        const fileName = `thinking_${Date.now()}.mp3`;
        const audioDir = path.join(ROOT_PATH, 'dashboard/client/public/audio');
        const destStream = fs.createWriteStream(path.join(audioDir, fileName));
        
        destStream.on('finish', () => {
            res.json({ success: true, audioUrl: `/audio/${fileName}` });
        });
        
        elRes.body.pipe(destStream);
        
    } catch (err) { 
        res.json({ success: false, error: err.message }); 
    }
});
```

## CARACTERÍSTICAS

### 1. Voice ID Configurable
- Por defecto usa `EXAVITQu4vr4xnSDxMaL` (Sarah - voz femenina en español)
- Se puede configurar en `.env` con `ELEVENLABS_VOICE_ID`
- Se puede guardar por sesión en `audio_config.voice_id`

### 2. Modelo Multilingüe
- Usa `eleven_multilingual_v2` que soporta español
- Configuración de voz optimizada:
  - `stability: 0.5` (balance entre consistencia y expresividad)
  - `similarity_boost: 0.75` (mantiene características de la voz)

### 3. Limpieza de Texto
- Remueve tags XML (`<think>`, `</think>`)
- Limita a 5000 caracteres (límite de ElevenLabs)
- Agrega "..." si el texto es muy largo

### 4. Manejo de Errores
- Valida API Key
- Valida que haya texto
- Maneja errores de ElevenLabs
- Maneja errores de escritura de archivo

## CONFIGURACIÓN

### Archivo `.env`
```bash
# API Key de ElevenLabs (requerido)
ELEVENLABS_API_KEY=tu_api_key_aqui

# Voice ID (opcional, por defecto usa Sarah)
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### Voces Disponibles
Puedes encontrar más voces en: https://elevenlabs.io/voice-library

Algunas voces en español:
- `EXAVITQu4vr4xnSDxMaL` - Sarah (femenina, clara)
- `pNInz6obpgDQGcFmaJgB` - Adam (masculina, profesional)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (femenina, cálida)

## USO

1. **Reiniciar servidor backend**:
```bash
cd dashboard/server
node server.js
```

2. **En la aplicación**:
   - Ejecuta un análisis para generar thinking
   - Haz click en el botón "Escuchar Thinking" (icono de volumen)
   - El audio se generará y reproducirá automáticamente

## LOGS

El servidor mostrará:
```
[TTS] Generando voz para thinking (sesión 5)
[TTS] Usando voice_id: EXAVITQu4vr4xnSDxMaL
[TTS] Longitud del texto: 1234 caracteres
[TTS] ✅ Archivo guardado: thinking_1234567890.mp3
```

## ARCHIVOS MODIFICADOS

- `dashboard/server/server.js`: Nuevo endpoint `/api/speak-thinking`
- `.env.example`: Agregada variable `ELEVENLABS_VOICE_ID`

## NOTAS

- Los archivos de audio se guardan en `dashboard/client/public/audio/`
- Los archivos tienen formato: `thinking_[timestamp].mp3`
- El frontend ya tenía la UI implementada, solo faltaba el endpoint backend
- La función usa la misma API Key que la generación de música
