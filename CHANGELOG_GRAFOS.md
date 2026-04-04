# Changelog - Sistema de Grafos de Conocimiento

Todos los cambios notables al sistema de grafos de conocimiento serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-04-03

### Agregado

#### Componentes de Código
- `dashboard/client/src/KnowledgeGraph.tsx` - Componente de visualización D3.js con:
  - Grafo de fuerza interactivo
  - Colores por agente (naranja, verde, rojo, púrpura)
  - Tamaños de nodos según certeza
  - Estilos de aristas según certeza
  - Zoom y pan
  - Drag de nodos
  - Panel de detalles al hacer clic
  - Leyenda visual

#### Scripts
- `setup_grafos.sh` - Script de instalación automatizada que:
  - Verifica dependencias del sistema (jq, Node.js, npm)
  - Instala dependencias del servidor y cliente
  - Verifica configuración de agentes
  - Proporciona instrucciones de uso
- `test_grafo.sh` - Script de testing que:
  - Copia grafo de ejemplo
  - Valida JSON
  - Muestra estadísticas del grafo
  - Proporciona instrucciones de visualización

#### Datos de Ejemplo
- `grafo_ejemplo.json` - Grafo de ejemplo con:
  - 9 entidades (2 bifurcaciones, 2 grounding, 2 neutralización, 3 ausencias)
  - 8 relaciones entre hallazgos
  - Metadata completa
  - Todos los tipos de entidades representados

#### Documentación
- `ANALISIS_GRAFOS_CONOCIMIENTO.md` - Documentación completa del sistema
- `TROUBLESHOOTING_GRAFOS.md` - Guía de resolución de 10 problemas comunes
- `RESUMEN_IMPLEMENTACION_GRAFOS.md` - Resumen ejecutivo de la implementación
- `EJEMPLOS_USO_GRAFOS.md` - 7 casos de uso detallados con código
- `CHECKLIST_GRAFOS.md` - Checklist de verificación con 100+ items
- `ARQUITECTURA_GRAFOS.md` - Diagramas de arquitectura en ASCII
- `CHANGELOG_GRAFOS.md` - Este archivo

### Modificado

#### Agentes (4 archivos)
- `workspaces/ausencias/IDENTITY.md`
  - Agregada sección "INSTRUCCIÓN DE OUTPUT ESTRUCTURADO"
  - Definidos tipos de entidades: tematica, geopolitica, historica, epistemica
  - Agregado campo `descripcion` para ausencias
  - Agregado campo `certeza` (alta/media/baja)
  
- `workspaces/bifurcaciones/IDENTITY.md`
  - Agregada sección "INSTRUCCIÓN DE OUTPUT ESTRUCTURADO"
  - Definido tipo de entidad: bifurcacion_descartada
  - Agregados campos `fragmento` y `descarte` (justificado/silencioso)
  - Agregado campo `certeza`
  
- `workspaces/grounding/IDENTITY.md`
  - Agregada sección "INSTRUCCIÓN DE OUTPUT ESTRUCTURADO"
  - Definidos tipos de entidades: omision_factual, generalizacion, fuente_fantasma
  - Agregados campos `omitido` y `reemplazado_por`
  - Agregado campo `certeza`
  
- `workspaces/neutralizacion/IDENTITY.md`
  - Agregada sección "INSTRUCCIÓN DE OUTPUT ESTRUCTURADO"
  - Definidos tipos de entidades: auto_validacion, universalizacion, cierre_prematuro
  - Agregado campo `pregunta_clausurada`
  - Agregado campo `certeza`

#### Script de Orquestación
- `ejecutar_fase1.sh`
  - Agregada función `extraer_json()` para extraer bloques JSON de Markdown
  - Agregada lógica de consolidación con jq
  - Agregada generación de `grafo.json` al finalizar
  - Agregados mensajes de log para el proceso de consolidación

#### Dashboard Frontend
- `dashboard/client/package.json`
  - Agregada dependencia: `"d3": "^7.9.0"`
  - Agregada dependencia de desarrollo: `"@types/d3": "^7.4.3"`
  
- `dashboard/client/src/App.tsx`
  - Agregado import de `KnowledgeGraph`
  - Agregado estado `grafoUrl`
  - Agregada pestaña "GRAFO" al array de tabs
  - Agregada lógica de renderizado condicional para el grafo
  - Agregada carga del grafo al completar análisis

#### Dashboard Backend
- `dashboard/server/server.js`
  - Agregado endpoint `GET /api/grafo` que:
    - Sirve `grafo.json` si existe
    - Retorna 404 si no existe
    - Usa `sendFile()` para servir el archivo

#### Documentación General
- `README.md`
  - Actualizada sección "Características" con grafos de conocimiento
  - Actualizada sección "Stack Tecnológico" con D3.js
  - Actualizada sección "Estructura del Proyecto" con nuevos archivos
  - Actualizada sección "Instalación" con script de setup
  - Actualizada sección "Uso" con instrucciones de interacción con el grafo
  - Agregada referencia a `ANALISIS_GRAFOS_CONOCIMIENTO.md`

### Decisiones Técnicas

#### Por qué D3.js y no otras alternativas
- **InfraNodus**: Descartado por ser de pago
- **react-force-graph**: Descartado por limitaciones de personalización
- **Neo4j**: Descartado por ser overkill para el caso de uso
- **D3.js**: Elegido por control total sobre la visualización

#### Por qué Bash + jq para consolidación
- El script `ejecutar_fase1.sh` ya está en Bash
- jq es más eficiente para transformaciones JSON simples
- Evita agregar dependencias Node.js adicionales
- Mantiene la lógica de orquestación en un solo lugar

#### Por qué JSON embebido en Markdown
- Los agentes ya producen Markdown
- Mantiene análisis narrativo + datos estructurados juntos
- Facilita debugging (un solo archivo por agente)
- Permite lectura humana del análisis completo

### Filosofía del Diseño

#### Incertidumbre Explícita
- Campo `certeza` en cada entidad y relación
- Refleja que los hallazgos son interpretaciones, no verdades
- El grafo no clausura el análisis, lo abre

#### Ausencias como Nodos
- Las ausencias son tan importantes como las presencias
- El grafo las hace visibles y relacionables
- Coherente con la filosofía crítica del proyecto TC2026

#### Conexiones Provisionales
- Las relaciones son hipótesis sobre cómo operan los sesgos
- Líneas punteadas indican conexiones especulativas
- No se pretende un mapa definitivo del sesgo

### Métricas de Implementación

- **Archivos creados**: 11
- **Archivos modificados**: 9
- **Líneas de código TypeScript**: ~450
- **Líneas de código Bash**: ~80
- **Líneas de documentación**: ~2500
- **Tiempo de implementación**: 1 sesión
- **Dependencias agregadas**: 2 (d3, @types/d3)

### Compatibilidad

- **Node.js**: 18+
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+
- **Sistema Operativo**: Linux, macOS, Windows (con WSL)

### Testing

- Script de testing automatizado (`test_grafo.sh`)
- Datos de ejemplo para validación (`grafo_ejemplo.json`)
- Checklist de verificación con 100+ items
- Comandos de validación manual documentados

## [Unreleased]

### Planeado para Fase 2

#### Procedencia Geopolítica
- [ ] Nodos para tradiciones jurídicas
- [ ] Nodos para geografías/regiones
- [ ] Relaciones `procede_de` entre marcos y corpus
- [ ] Visualización de clusters geográficos

#### Mejoras de Visualización
- [ ] Filtrado por agente
- [ ] Filtrado por certeza
- [ ] Búsqueda de nodos
- [ ] Exportación a PNG/SVG
- [ ] Modo de presentación (fullscreen)

#### Performance
- [ ] Clustering automático con algoritmo Louvain
- [ ] Web Workers para simulación
- [ ] Canvas fallback para grafos grandes (>100 nodos)
- [ ] Virtualización de nodos

#### Análisis Avanzado
- [ ] Comparación entre múltiples sesiones
- [ ] Detección de patrones recurrentes
- [ ] Métricas de centralidad
- [ ] Detección de comunidades

### Planeado para Fase 3

#### Bibliografía Fantasma
- [ ] Nodos para citas implícitas
- [ ] Detección automática de fuentes no mencionadas
- [ ] Relaciones `cita_implicitamente`
- [ ] Integración con bases de datos bibliográficas

#### Integración con Herramientas Externas
- [ ] Exportación a Gephi (GEXF)
- [ ] Exportación a Cytoscape
- [ ] API REST para consultas al grafo
- [ ] Webhooks para notificaciones

#### Colaboración
- [ ] Anotaciones en nodos
- [ ] Comentarios en relaciones
- [ ] Versionado de grafos
- [ ] Comparación de interpretaciones

## Notas de Versión

### [1.0.0] - Lanzamiento Inicial

Esta es la primera versión estable del sistema de grafos de conocimiento para TC2026. Incluye todas las funcionalidades básicas necesarias para visualizar las relaciones entre los hallazgos de los 4 agentes críticos.

**Características principales:**
- Visualización interactiva con D3.js
- Consolidación automática de JSON
- Documentación completa
- Scripts de instalación y testing
- Ejemplos de uso

**Limitaciones conocidas:**
- Performance limitada para grafos >100 nodos
- No hay persistencia de grafos históricos
- No hay comparación entre sesiones
- No hay exportación a formatos externos

**Próximos pasos:**
- Implementar Fase 2 (procedencia geopolítica)
- Mejorar performance para grafos grandes
- Agregar análisis longitudinal

---

## Formato del Changelog

### Tipos de Cambios
- `Agregado` para nuevas funcionalidades
- `Modificado` para cambios en funcionalidades existentes
- `Deprecado` para funcionalidades que serán removidas
- `Removido` para funcionalidades removidas
- `Corregido` para corrección de bugs
- `Seguridad` para vulnerabilidades

### Versionado
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs compatibles

---

**Mantenido por:** Equipo TC2026  
**Última actualización:** 3 de abril de 2026
