# Visualización de Consulta de Sesión

## Problema
Cuando el usuario cambiaba de sesión, la consulta original desaparecía y no se sabía a qué consulta pertenecían los resultados mostrados.

## Solución Implementada

### Backend (Ya implementado previamente)
- El endpoint `/api/results` ya devuelve el campo `input_prompt` con la consulta original de la sesión

### Frontend - Cambios Realizados

#### 1. Componente Visual (App.tsx)
Se agregó un banner visual justo después del header que muestra:
- **Etiqueta "CONSULTA ACTUAL"**: Identificador visual del propósito del banner
- **Texto de la consulta**: La consulta original del usuario
- **ID de sesión**: Número de sesión actual para referencia

```tsx
{currentSessionId && currentSessionPrompt && (
  <div className="current-query-banner">
    <div className="query-label">CONSULTA ACTUAL</div>
    <div className="query-text">{currentSessionPrompt}</div>
    <div className="query-session-id">Sesión #{currentSessionId}</div>
  </div>
)}
```

#### 2. Actualización del Estado
- El estado `currentSessionPrompt` ya existía
- Se actualiza en `loadSessionData()` cuando se carga una sesión
- Se actualiza en `runPipeline()` cuando se crea una nueva consulta

#### 3. Estilos CSS
Se agregaron estilos para el banner con:
- Fondo degradado oscuro (azul-gris)
- Bordes y sombras sutiles
- Layout flexible con tres secciones
- Texto truncado con ellipsis si es muy largo
- Diseño responsive y consistente con el tema del sistema

```css
.current-query-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}
```

## Comportamiento

### Cuando se muestra el banner:
- Solo se muestra si hay una sesión activa (`currentSessionId`)
- Solo se muestra si hay una consulta (`currentSessionPrompt`)

### Actualización del banner:
1. **Al cambiar de sesión**: Se actualiza automáticamente con la consulta de la sesión seleccionada
2. **Al crear nueva consulta**: Se actualiza inmediatamente con el nuevo prompt
3. **Al crear nueva sesión**: Se oculta hasta que se ejecute una consulta

## Ubicación Visual
El banner se ubica:
- Después del header principal
- Antes del panel de sesiones (si está abierto)
- Antes del panel de configuración de agentes (si está abierto)
- Siempre visible cuando hay una sesión activa

## Archivos Modificados
- `dashboard/client/src/App.tsx`: Componente visual y lógica de actualización

## Estado
✅ **COMPLETADO** - La consulta ahora se muestra de forma persistente al cambiar de sesión
