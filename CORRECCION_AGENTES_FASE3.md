# Corrección de Agentes de Fase 3

## Problema Detectado
Los agentes de Fase 3 estaban retornando solo JSON sin análisis en Markdown, a diferencia de los agentes de Fase 1 y 2 que devuelven análisis explicativo + JSON estructurado.

## Causa
Las definiciones de los agentes de Fase 3 tenían:
- ❌ Sección "Formato de Salida JSON" (sin instrucción de hacer análisis Markdown primero)
- ❌ Sección "Ejemplo de Operación" (que confundía al modelo)
- ❌ No especificaban claramente que el JSON debe ir AL FINAL del análisis

## Solución Implementada

### Cambios en los 4 Agentes de Fase 3

#### 1. Eliminadas Secciones Problemáticas
- ❌ "Formato de Salida JSON" → Eliminada
- ❌ "Ejemplo de Operación" → Eliminada

#### 2. Agregada Sección "INSTRUCCIÓN DE OUTPUT ESTRUCTURADO"
Siguiendo el mismo patrón de Fase 1 y 2:

```markdown
## INSTRUCCIÓN DE OUTPUT ESTRUCTURADO

Primero, realizá tu análisis en Markdown explicando:
- [Puntos específicos del análisis]

Luego, al final de tu análisis en Markdown, agregá obligatoriamente un bloque JSON
con la siguiente estructura exacta, delimitado por las etiquetas indicadas:

```json
{
  // Estructura JSON
}
```

Reglas para el JSON:
- El JSON debe aparecer AL FINAL de tu análisis en Markdown
- Debe estar delimitado por triple backtick con "json"
- Todas las entidades mencionadas en el JSON deben haber sido explicadas en el análisis Markdown
- El JSON debe ser válido y parseable
- No agregues comentarios dentro del JSON
```

### Estructura Correcta del Output

#### Antes (Incorrecto)
```json
{
  "agente": "fuentes_activadas",
  "analisis": { ... }
}
```

#### Ahora (Correcto)
```markdown
# Análisis de Fuentes Activadas y Descartadas

## Fuentes Explícitas Identificadas
[Análisis en texto explicativo...]

## Fuentes Descartadas
[Análisis en texto explicativo...]

## Bibliografía Fantasma
[Análisis en texto explicativo...]

## Patrón de Validación
[Análisis en texto explicativo...]

```json
{
  "agente": "fuentes_activadas",
  "analisis": { ... }
}
```
```

## Agentes Corregidos

### 1. fuentes_activadas
- ✅ Análisis Markdown: Fuentes explícitas, descartadas, bibliografía fantasma, patrón de validación
- ✅ JSON al final con estructura completa

### 2. opacidad_residual
- ✅ Análisis Markdown: Saltos lógicos, descartes sin elaboración, conclusiones sin proceso, zonas de silencio
- ✅ JSON al final con mapa de opacidad

### 3. sensibilidad_contextual
- ✅ Análisis Markdown: Parámetros explícitos/implícitos, experimentos de variación, grado de dependencia
- ✅ JSON al final con mapa de dependencia

### 4. vigencia_provisional
- ✅ Análisis Markdown: Marcadores temporales, dependencias implícitas, variables de contingencia, transferibilidad
- ✅ JSON al final con metadatos y patrón de provisionalidad

## Consistencia con Fases Anteriores

### Fase 1 (Patrón Original)
```markdown
[Análisis en Markdown]

```json-grafo
{ ... }
```
```

### Fase 2 (Mismo Patrón)
```markdown
[Análisis en Markdown]

```json-grafo
{ ... }
```
```

### Fase 3 (Ahora Corregido)
```markdown
[Análisis en Markdown]

```json
{ ... }
```
```

## Diferencias de Formato JSON

### Fase 1 y 2
- Usan delimitador: ` ```json-grafo `
- Incluyen campos: `entidades` y `relaciones` (para grafos)

### Fase 3
- Usan delimitador: ` ```json `
- Incluyen campos: `analisis` y `observaciones` (no son para grafos)

Esto es correcto porque Fase 3 no genera grafos de conocimiento, sino análisis de fragilidad del thinking.

## Archivos Modificados
- `workspaces/fuentes_activadas/IDENTITY.md`
- `workspaces/opacidad_residual/IDENTITY.md`
- `workspaces/sensibilidad_contextual/IDENTITY.md`
- `workspaces/vigencia_provisional/IDENTITY.md`

## Actualización de Base de Datos

Las definiciones se actualizarán automáticamente en la base de datos al reiniciar el servidor, ya que `db.js` lee dinámicamente los archivos IDENTITY.md:

```javascript
const defaultDefinitionsFase3 = {
    'fuentes_activadas': fs.readFileSync(path.resolve(__dirname, '../../workspaces/fuentes_activadas/IDENTITY.md'), 'utf8'),
    // ...
};
```

## Próximos Pasos

1. ✅ Reiniciar el servidor para cargar las nuevas definiciones
2. ✅ Probar un análisis completo de Fase 3
3. ✅ Verificar que los agentes devuelvan Markdown + JSON
4. ✅ Confirmar que el JSON sea parseable y válido

## Estado
✅ **COMPLETADO** - Agentes de Fase 3 corregidos para devolver análisis Markdown + JSON
