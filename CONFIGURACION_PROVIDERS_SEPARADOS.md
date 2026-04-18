# Configuración de Providers Separados

## Resumen
El sistema ahora usa providers diferentes para el thinking y los agentes, optimizando costos y calidad de análisis.

## Arquitectura de Providers

### 1. THINKING (Generación Inicial)
**Provider**: Ollama o NVIDIA (configurable)
**Variable**: `THINKING_PROVIDER`

El thinking se genera con modelos más rápidos y económicos porque:
- Es el razonamiento inicial del modelo
- No requiere análisis crítico profundo
- Se genera una sola vez por consulta
- Prioriza velocidad y costo

**Opciones disponibles**:
- `ollama` (por defecto) - Qwen 3.5:4b local
- `nvidia` - DeepSeek V3.2 en cloud

**NO soporta**: Anthropic (Claude es muy costoso para thinking)

### 2. AGENTES (Análisis Crítico)
**Provider**: Anthropic (Claude) - FORZADO
**No configurable**

Los agentes siempre usan Claude porque:
- Requieren análisis crítico profundo
- Necesitan seguir instrucciones complejas
- Deben producir JSON estructurado
- Son 12 agentes (4 por fase × 3 fases)
- La calidad del análisis es crítica

**Modelo**: `claude-haiku-4-5-20251001` (rápido y económico)

## Configuración en .env

```env
# ============================================
# THINKING: Ollama o NVIDIA
# ============================================
THINKING_PROVIDER=ollama  # o 'nvidia'

# Ollama Config (si THINKING_PROVIDER=ollama)
OLLAMA_URL=http://localhost:11434/v1/chat/completions
OLLAMA_MODEL=qwen3.5:4b

# NVIDIA Config (si THINKING_PROVIDER=nvidia)
NVIDIA_API_KEY=nvapi-xxxxx
NVIDIA_MODEL=deepseek-ai/deepseek-v3.2
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# ============================================
# AGENTES: Siempre Anthropic (no configurable)
# ============================================
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

## Flujo de Ejecución

```
Usuario: "El Estado garantiza seguridad"
    ↓
[THINKING] → Ollama/NVIDIA
    ↓
Thinking generado: <think>...</think>
    ↓
[FASE 1] → 4 Agentes con Anthropic
    ↓
[FASE 2] → 4 Agentes con Anthropic
    ↓
[FASE 3] → 4 Agentes con Anthropic
    ↓
Análisis completo
```

## Ventajas de esta Arquitectura

### 1. Optimización de Costos
- Thinking: Modelo económico (Ollama gratis, NVIDIA barato)
- Agentes: Claude Haiku (más caro pero necesario)
- Total: ~90% más económico que usar Claude para todo

### 2. Optimización de Velocidad
- Thinking: Modelos rápidos (Qwen, DeepSeek)
- Agentes: Claude Haiku (más rápido que Sonnet/Opus)

### 3. Calidad Garantizada
- Thinking: Suficiente para razonamiento inicial
- Agentes: Claude garantiza análisis crítico de calidad

### 4. Flexibilidad
- Puedes cambiar el provider del thinking sin afectar agentes
- Puedes usar Ollama local (gratis) o NVIDIA cloud (barato)

## Comparación de Costos (estimado)

### Opción 1: Todo con Claude Sonnet
- Thinking: $0.015 por consulta
- 12 Agentes: $0.180 por consulta
- **Total: $0.195 por consulta**

### Opción 2: Thinking con Ollama + Agentes con Claude Haiku
- Thinking: $0.000 (local)
- 12 Agentes: $0.012 por consulta
- **Total: $0.012 por consulta** (94% más barato)

### Opción 3: Thinking con NVIDIA + Agentes con Claude Haiku
- Thinking: $0.001 por consulta
- 12 Agentes: $0.012 por consulta
- **Total: $0.013 por consulta** (93% más barato)

## Implementación Técnica

### Función `generate-thinking`
```javascript
// THINKING puede usar OLLAMA o NVIDIA (no Anthropic)
const THINKING_PROVIDER = process.env.THINKING_PROVIDER || 'ollama';

if (THINKING_PROVIDER === 'nvidia') {
    // Configuración NVIDIA
} else {
    // Default: Ollama
}
```

### Función `ejecutarAgente`
```javascript
// FORZAR ANTHROPIC PARA LOS AGENTES
const PROVIDER = 'anthropic';

const url = 'https://api.anthropic.com/v1/messages';
const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
// ... configuración de Anthropic
```

## Logs del Sistema

### Thinking
```
[OK] Thinking Sesión 5 (Provider: ollama, Model: qwen3.5:4b)
```
o
```
[OK] Thinking Sesión 5 (Provider: nvidia, Model: deepseek-ai/deepseek-v3.2)
```

### Agentes
```
[OK] Agente ausencias (5) - Provider: anthropic
[OK] Agente bifurcaciones (5) - Provider: anthropic
```

## Variables Eliminadas

- ❌ `LLM_PROVIDER` - Ya no se usa
- ✅ `THINKING_PROVIDER` - Nueva variable específica para thinking
- ✅ Agentes siempre usan Anthropic (hardcoded)

## Migración desde Configuración Anterior

### Antes
```env
LLM_PROVIDER=anthropic  # Afectaba todo
```

### Ahora
```env
THINKING_PROVIDER=ollama  # Solo afecta thinking
# Agentes siempre usan Anthropic
```

## Recomendaciones

### Para Desarrollo
```env
THINKING_PROVIDER=ollama
```
- Gratis (local)
- Rápido
- Suficiente para testing

### Para Producción (bajo costo)
```env
THINKING_PROVIDER=ollama
```
- Gratis (local)
- Requiere servidor con Ollama instalado

### Para Producción (cloud)
```env
THINKING_PROVIDER=nvidia
```
- Muy económico
- No requiere infraestructura local
- Escalable

## Archivos Modificados
- `dashboard/server/server.js`: 
  - Función `generate-thinking`: Usa `THINKING_PROVIDER` (ollama/nvidia)
  - Función `ejecutarAgente`: Forzado a Anthropic
- `.env.example`: Documentación actualizada

## Estado
✅ **COMPLETADO** - Providers separados y optimizados

## Notas Importantes

1. **No puedes usar Anthropic para thinking**: Es muy costoso y no es necesario
2. **No puedes cambiar el provider de agentes**: Siempre usan Anthropic por calidad
3. **Ollama es la opción por defecto**: Gratis y suficiente para thinking
4. **NVIDIA es opcional**: Para quienes prefieren cloud sobre local
