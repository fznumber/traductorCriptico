# Configuración de Provider Unificado

## CAMBIO IMPLEMENTADO

Ahora TODO el proceso (thinking + agentes) usa el MISMO provider configurado en `.env`.

### Antes:
- `THINKING_PROVIDER` - Solo para thinking (ollama o nvidia)
- Agentes - Forzados a usar Anthropic

### Ahora:
- `LLM_PROVIDER` - Para TODO (thinking + agentes)
- Opciones: `ollama`, `anthropic` o `nvidia`

## CONFIGURACIÓN

### Archivo `.env`:

```bash
# Provider unificado para todo el proceso
LLM_PROVIDER=nvidia  # o 'anthropic' o 'ollama'

# Configuración de cada provider (solo se usa el seleccionado)
OLLAMA_URL=http://localhost:11434/v1/chat/completions
OLLAMA_MODEL=qwen3.5:4b

ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxx
NVIDIA_MODEL=deepseek-ai/deepseek-v3.2
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

## OPCIONES DE PROVIDER

### 1. NVIDIA (Recomendado para producción)
```bash
LLM_PROVIDER=nvidia
```

**Ventajas:**
- ✅ Cloud (no requiere instalación local)
- ✅ Modelos potentes (DeepSeek V3.2)
- ✅ Rápido y confiable
- ✅ Económico

**Requiere:**
- API Key de NVIDIA (https://build.nvidia.com/)

### 2. Anthropic (Máxima calidad)
```bash
LLM_PROVIDER=anthropic
```

**Ventajas:**
- ✅ Máxima calidad de análisis
- ✅ Claude Haiku 4.5
- ✅ Excelente para análisis crítico

**Desventajas:**
- ❌ Más costoso
- ❌ Requiere API Key de Anthropic

**Requiere:**
- API Key de Anthropic (https://console.anthropic.com/)

### 3. Ollama (Desarrollo local)
```bash
LLM_PROVIDER=ollama
```

**Ventajas:**
- ✅ Completamente gratis
- ✅ Local (privacidad total)
- ✅ No requiere API keys

**Desventajas:**
- ❌ Requiere instalación local
- ❌ Requiere recursos de hardware
- ❌ Calidad inferior a modelos cloud

**Requiere:**
- Ollama instalado localmente
- Modelo descargado (qwen3.5:4b)

## FLUJO COMPLETO

Con `LLM_PROVIDER=nvidia`:

```
1. Usuario escribe prompt
   ↓
2. NVIDIA genera thinking
   ↓
3. NVIDIA ejecuta 4 agentes Fase 1
   ↓
4. NVIDIA ejecuta 4 agentes Fase 2
   ↓
5. NVIDIA ejecuta 4 agentes Fase 3
```

Todo usando el mismo provider y modelo.

## LOGS

Los logs ahora muestran el provider usado:

```
[OK] Thinking Sesión 5 (Provider: nvidia, Model: deepseek-ai/deepseek-v3.2)
[OK] Agente ausencias (5) - Provider: nvidia, Model: deepseek-ai/deepseek-v3.2
[OK] Agente bifurcaciones (5) - Provider: nvidia, Model: deepseek-ai/deepseek-v3.2
...
```

## CAMBIAR DE PROVIDER

Para cambiar de provider:

1. Edita `.env`:
```bash
LLM_PROVIDER=anthropic  # o nvidia u ollama
```

2. Reinicia el servidor:
```bash
cd dashboard/server
node server.js
```

3. Los nuevos análisis usarán el nuevo provider

## COMPARACIÓN DE COSTOS

### Análisis completo (1 thinking + 12 agentes):

**NVIDIA (DeepSeek V3.2):**
- Costo: ~$0.01 - $0.02 por análisis
- Velocidad: Rápida

**Anthropic (Claude Haiku):**
- Costo: ~$0.15 - $0.25 por análisis
- Velocidad: Rápida
- Calidad: Superior

**Ollama (Local):**
- Costo: $0 (gratis)
- Velocidad: Depende del hardware
- Calidad: Buena

## RECOMENDACIONES

### Para desarrollo:
```bash
LLM_PROVIDER=ollama
```

### Para producción (económico):
```bash
LLM_PROVIDER=nvidia
```

### Para máxima calidad:
```bash
LLM_PROVIDER=anthropic
```

## ARCHIVOS MODIFICADOS

- `dashboard/server/server.js`:
  - Función `ejecutarAgente()` - Ahora soporta 3 providers
  - Endpoint `/api/generate-thinking` - Ahora soporta 3 providers
  
- `.env.example`:
  - Cambiado `THINKING_PROVIDER` por `LLM_PROVIDER`
  - Documentación actualizada

- `.env`:
  - Variable actualizada a `LLM_PROVIDER`

## MIGRACIÓN DESDE VERSIÓN ANTERIOR

Si tenías `THINKING_PROVIDER` en tu `.env`:

```bash
# Antes
THINKING_PROVIDER=nvidia

# Ahora
LLM_PROVIDER=nvidia
```

Simplemente renombra la variable y reinicia el servidor.

## NOTAS IMPORTANTES

1. **API Keys**: Solo necesitas la API key del provider que uses
2. **Consistencia**: Todo el análisis usa el mismo provider/modelo
3. **Logs**: Los logs muestran qué provider se usó para cada operación
4. **Base de datos**: La tabla `agent_logs` guarda el provider y modelo usado

## VERIFICACIÓN

Para verificar que está funcionando:

1. Ejecuta un análisis
2. Revisa los logs del servidor
3. Deberías ver:
```
[OK] Thinking Sesión X (Provider: nvidia, Model: deepseek-ai/deepseek-v3.2)
[OK] Agente ausencias (X) - Provider: nvidia, Model: deepseek-ai/deepseek-v3.2
```

Si ves el provider correcto en los logs, está funcionando correctamente.
