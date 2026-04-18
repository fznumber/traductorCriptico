# Soporte para NVIDIA como Provider de LLM

## Resumen
Se agregó soporte completo para NVIDIA como proveedor de LLM, tanto para la generación del thinking como para la ejecución de agentes de las 3 fases.

## Cambios Implementados

### 1. Generación del Thinking
**Antes**: El thinking estaba forzado a usar Ollama exclusivamente.

**Ahora**: El thinking respeta la variable `LLM_PROVIDER` y puede usar:
- **Ollama** (por defecto)
- **Anthropic** (Claude)
- **NVIDIA** (DeepSeek u otros modelos)

### 2. Ejecución de Agentes
Se agregó soporte de NVIDIA en la función `ejecutarAgente()` para que todos los agentes de Fase 1, 2 y 3 puedan usar NVIDIA.

## Configuración en .env

```env
# Provider: 'ollama', 'anthropic' or 'nvidia'
LLM_PROVIDER=nvidia

# NVIDIA API Config
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_MODEL=deepseek-ai/deepseek-v3.2
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

## Implementación Técnica

### Función `generate-thinking`
```javascript
const PROVIDER = process.env.LLM_PROVIDER || 'ollama';

if (PROVIDER === 'anthropic') {
    // Configuración de Anthropic
} else if (PROVIDER === 'nvidia') {
    url = process.env.NVIDIA_BASE_URL + '/chat/completions';
    model = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v3.2';
    headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}` 
    };
    body = { 
        model, 
        messages: [{ role: 'user', content: prompt }], 
        temperature: 0.2, 
        top_p: 0.7, 
        max_tokens: 4096, 
        stream: false 
    };
} else {
    // Default: Ollama
}
```

### Función `ejecutarAgente`
Misma lógica aplicada para la ejecución de agentes de las 3 fases.

## Parámetros de NVIDIA

### Headers
- `Content-Type`: `application/json`
- `Authorization`: `Bearer ${NVIDIA_API_KEY}`

### Body
- `model`: Modelo a usar (ej: `deepseek-ai/deepseek-v3.2`)
- `messages`: Array de mensajes con rol y contenido
- `temperature`: 0.2 (control de creatividad)
- `top_p`: 0.7 (nucleus sampling)
- `max_tokens`: 4096 (longitud máxima de respuesta)
- `stream`: false (respuesta completa, no streaming)

### URL
- Base: `https://integrate.api.nvidia.com/v1`
- Endpoint: `/chat/completions`
- URL completa: `https://integrate.api.nvidia.com/v1/chat/completions`

## Formato de Respuesta

NVIDIA usa el formato estándar de OpenAI:
```json
{
  "choices": [
    {
      "message": {
        "content": "respuesta del modelo"
      }
    }
  ]
}
```

Por lo tanto, se extrae con: `d.choices[0].message.content`

## Providers Soportados

### 1. Ollama (por defecto)
- URL: `http://localhost:11434/v1/chat/completions`
- Modelo: `qwen3.5:4b`
- Sin autenticación

### 2. Anthropic (Claude)
- URL: `https://api.anthropic.com/v1/messages`
- Modelo: `claude-haiku-4-5-20251001`
- Autenticación: `x-api-key` header
- Formato de respuesta diferente: `d.content[0].text`

### 3. NVIDIA (nuevo)
- URL: `https://integrate.api.nvidia.com/v1/chat/completions`
- Modelo: `deepseek-ai/deepseek-v3.2` (u otros disponibles)
- Autenticación: `Bearer` token
- Formato de respuesta: OpenAI compatible

## Ventajas de NVIDIA

1. **Modelos Potentes**: Acceso a modelos como DeepSeek V3.2
2. **API Estable**: Infraestructura robusta de NVIDIA
3. **Compatibilidad**: Formato OpenAI compatible
4. **Escalabilidad**: Infraestructura cloud de NVIDIA

## Logs Mejorados

Los logs ahora incluyen información del provider y modelo usado:
```
[OK] Thinking Sesión 5 (Provider: nvidia, Model: deepseek-ai/deepseek-v3.2)
[OK] Agente ausencias (5)
```

## Archivos Modificados
- `dashboard/server/server.js`: 
  - Función `generate-thinking`: Agregado soporte NVIDIA
  - Función `ejecutarAgente`: Agregado soporte NVIDIA

## Estado
✅ **COMPLETADO** - NVIDIA soportado para thinking y todos los agentes

## Uso

Para usar NVIDIA, simplemente cambia en el `.env`:
```env
LLM_PROVIDER=nvidia
```

El sistema automáticamente usará NVIDIA para:
- Generación del thinking
- Ejecución de agentes de Fase 1
- Ejecución de agentes de Fase 2
- Ejecución de agentes de Fase 3
