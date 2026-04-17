# Guía de Uso: Sistema de Múltiples Sesiones

## ¿Qué son las sesiones?

Cada sesión representa un análisis completo e independiente:
- Un prompt inicial
- Su thinking generado
- Los resultados de los 4 agentes (ausencias, bifurcaciones, grounding, neutralizacion)
- Configuración de audio personalizada
- Estado de la interfaz

## Interfaz de Usuario

### Botón "📋 SESIONES"
Ubicado en el header, junto a "🚪 SALIR" y "⚙️ Configuración"

**Al hacer click:**
- Se abre un panel desplegable con todas tus sesiones
- Muestra el contador total: `SESIONES (5)` por ejemplo

### Panel de Sesiones

```
┌─────────────────────────────────────────────────────┐
│ Gestión de Sesiones          [➕ Nueva Sesión]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Sesión #15                         [🗑️] │       │
│  │ El Estado garantiza seguridad           │       │
│  │ 15/04/2026, 14:30                       │       │
│  │ ✓ Completa                              │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Sesión #14                         [🗑️] │  ← Activa
│  │ La democracia es participación          │       │
│  │ 15/04/2026, 12:15                       │       │
│  │ ✓ Completa                              │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  ┌─────────────────────────────────────────┐       │
│  │ Sesión #13                         [🗑️] │       │
│  │ Nueva sesión                            │       │
│  │ 14/04/2026, 18:45                       │       │
│  │ ○ Incompleta                            │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Elementos Visuales

**Sesión Activa:**
- Borde azul brillante (#60a5fa)
- Fondo azul oscuro (#1e3a5f)
- Sombra luminosa

**Sesión Inactiva:**
- Borde gris (#222)
- Fondo negro (#111)
- Al pasar el mouse: borde azul

**Estados:**
- `✓ Completa` (verde): Tiene thinking y análisis generados
- `○ Incompleta` (amarillo): Sesión creada pero sin análisis

**Botón Eliminar (🗑️):**
- Solo visible en sesiones inactivas
- Al hacer hover: fondo rojo
- Requiere confirmación

## Operaciones

### 1. Ver todas las sesiones
```
Click en "📋 SESIONES" → Se abre el panel
```

### 2. Cambiar de sesión
```
Click en cualquier sesión del panel → Se cargan sus datos
```
- Los resultados se actualizan
- El log se limpia
- Se carga la configuración de audio/pantallas de esa sesión

### 3. Crear nueva sesión
```
Click en "➕ Nueva Sesión" → Se crea sesión vacía
```
- Se limpia el estado actual
- Se genera un nuevo ID de sesión
- Lista para un nuevo análisis

### 4. Eliminar sesión
```
Click en 🗑️ → Confirmar → Sesión eliminada
```
- Si eliminas la sesión activa, se cambia automáticamente a otra
- Si era la única sesión, se crea una nueva automáticamente

### 5. Ejecutar nuevo análisis
```
Escribir prompt → Click en "ANALIZAR"
```
- Se crea automáticamente una nueva sesión
- El prompt se guarda como `input_prompt`
- Se actualiza la lista de sesiones

## Casos de Uso

### Comparar diferentes análisis
1. Analiza "El Estado garantiza seguridad"
2. Espera a que termine
3. Click en "📋 SESIONES" → "➕ Nueva Sesión"
4. Analiza "El Estado protege a los ciudadanos"
5. Cambia entre sesiones para comparar resultados

### Recuperar análisis anterior
1. Login como usuario
2. Se carga automáticamente tu última sesión
3. Click en "📋 SESIONES" para ver todas
4. Click en cualquier sesión antigua para revisarla

### Limpiar sesiones antiguas
1. Click en "📋 SESIONES"
2. Click en 🗑️ en las sesiones que quieras eliminar
3. Confirma la eliminación

## Persistencia de Datos

**Por sesión se guarda:**
- ✓ Prompt inicial
- ✓ Thinking generado
- ✓ Resultados de los 4 agentes
- ✓ Configuración de audio (música, efectos)
- ✓ Estado de UI (layout de pantallas)
- ✓ Definiciones personalizadas de agentes
- ✓ Fecha y hora de creación

**Al cambiar de sesión:**
- Se recuperan TODOS estos datos
- La experiencia es idéntica a cuando se creó

## Atajos de Teclado

Actualmente no hay atajos, pero se pueden agregar:
- `Ctrl+N`: Nueva sesión
- `Ctrl+Tab`: Siguiente sesión
- `Ctrl+Shift+Tab`: Sesión anterior
- `Ctrl+W`: Cerrar sesión actual

## Notas Técnicas

- Las sesiones se almacenan en SQLite (`tc2026.db`)
- Cada usuario tiene sus propias sesiones aisladas
- No hay límite de sesiones por usuario
- Las sesiones eliminadas no se pueden recuperar
- El sistema usa Foreign Keys con CASCADE DELETE
