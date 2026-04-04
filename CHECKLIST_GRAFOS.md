# Checklist de Verificación - Sistema de Grafos de Conocimiento

## Pre-instalación

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] jq instalado (`jq --version`)
- [ ] Ollama instalado y corriendo (si se usa local)
- [ ] Modelo `qwen3.5:4b` descargado (`ollama list`)
- [ ] Git instalado (para clonar el repositorio)

## Instalación

- [ ] Repositorio clonado
- [ ] Archivo `.env` configurado con las API keys necesarias
- [ ] Script de instalación ejecutado: `bash setup_grafos.sh`
- [ ] Dependencias del servidor instaladas (`dashboard/node_modules` existe)
- [ ] Dependencias del cliente instaladas (`dashboard/client/node_modules` existe)
- [ ] D3.js instalado (`grep "d3" dashboard/client/package.json`)

## Configuración de Agentes

- [ ] `workspaces/ausencias/IDENTITY.md` contiene instrucciones JSON
- [ ] `workspaces/bifurcaciones/IDENTITY.md` contiene instrucciones JSON
- [ ] `workspaces/grounding/IDENTITY.md` contiene instrucciones JSON
- [ ] `workspaces/neutralizacion/IDENTITY.md` contiene instrucciones JSON
- [ ] Todos los bloques JSON tienen la etiqueta `json-grafo`
- [ ] Todos los bloques JSON son sintácticamente válidos

## Script de Consolidación

- [ ] `ejecutar_fase1.sh` tiene permisos de ejecución (`chmod +x`)
- [ ] Script contiene la función `extraer_json`
- [ ] Script usa `jq` para consolidar JSON
- [ ] Script genera `grafo.json` al finalizar

## Componente de Visualización

- [ ] Archivo `dashboard/client/src/KnowledgeGraph.tsx` existe
- [ ] Componente importa D3.js correctamente
- [ ] Componente define `colorMap` con los 4 agentes
- [ ] Componente maneja estados de carga y error
- [ ] Componente tiene panel de detalles

## Integración en Dashboard

- [ ] `App.tsx` importa `KnowledgeGraph`
- [ ] `App.tsx` tiene estado `grafoUrl`
- [ ] Pestaña "GRAFO" agregada al array de tabs
- [ ] Pestaña "GRAFO" se habilita cuando `grafoUrl` existe
- [ ] Lógica de carga del grafo en el polling de resultados

## Endpoint del Servidor

- [ ] `dashboard/server/server.js` tiene endpoint `/api/grafo`
- [ ] Endpoint sirve el archivo `grafo.json` desde ROOT_PATH
- [ ] Endpoint retorna 404 si el archivo no existe
- [ ] Servidor tiene CORS configurado correctamente

## Testing Básico

- [ ] Test de ejemplo ejecutado: `bash test_grafo.sh`
- [ ] `grafo_ejemplo.json` es JSON válido
- [ ] Servidor inicia sin errores: `cd dashboard && npm start`
- [ ] Cliente inicia sin errores: `cd dashboard/client && npm run dev`
- [ ] Dashboard accesible en `http://localhost:5173`
- [ ] Pestaña GRAFO visible (aunque deshabilitada sin datos)

## Testing de Integración

- [ ] Archivo `thinking.txt` con contenido de prueba
- [ ] Script ejecutado: `bash ejecutar_fase1.sh`
- [ ] Script completa sin errores
- [ ] Archivo `grafo.json` generado
- [ ] `grafo.json` es JSON válido (`jq empty grafo.json`)
- [ ] `grafo.json` contiene entidades de los 4 agentes
- [ ] `grafo.json` contiene relaciones

## Visualización en Dashboard

- [ ] Grafo se carga en la pestaña GRAFO
- [ ] Nodos tienen colores correctos por agente
- [ ] Nodos tienen tamaños diferentes según certeza
- [ ] Aristas tienen estilos diferentes según certeza
- [ ] Zoom funciona (rueda del mouse)
- [ ] Pan funciona (arrastrar fondo)
- [ ] Drag de nodos funciona
- [ ] Click en nodo muestra panel de detalles
- [ ] Panel de detalles muestra toda la información
- [ ] Botón X cierra el panel de detalles
- [ ] Leyenda visible y correcta

## Validación de Datos

- [ ] Todos los nodos tienen `id` único
- [ ] Todos los nodos tienen `agente` válido (ausencias|bifurcaciones|grounding|neutralizacion)
- [ ] Todos los nodos tienen `tipo` válido según su agente
- [ ] Todos los nodos tienen `certeza` válida (alta|media|baja)
- [ ] Todas las relaciones tienen `desde` e `hacia` válidos
- [ ] Todos los IDs en relaciones existen en entidades
- [ ] No hay nodos huérfanos (sin relaciones) a menos que sea intencional

## Performance

- [ ] Grafo con <50 nodos renderiza en <2 segundos
- [ ] Drag de nodos es fluido (sin lag)
- [ ] Zoom es fluido
- [ ] Simulación se estabiliza en <5 segundos
- [ ] No hay memory leaks (verificar en DevTools)

## Documentación

- [ ] `README.md` actualizado con información de grafos
- [ ] `ANALISIS_GRAFOS_CONOCIMIENTO.md` completo
- [ ] `TROUBLESHOOTING_GRAFOS.md` completo
- [ ] `RESUMEN_IMPLEMENTACION_GRAFOS.md` completo
- [ ] `EJEMPLOS_USO_GRAFOS.md` completo
- [ ] Todos los archivos Markdown tienen formato correcto

## Casos de Uso

- [ ] Caso 1: Análisis de enunciado normativo funciona
- [ ] Caso 2: Comparación de modelos es posible
- [ ] Caso 3: Análisis longitudinal es posible
- [ ] Caso 4: Auditoría de dominio específico es posible
- [ ] Caso 5: Debugging de prompts es posible
- [ ] Caso 6: Exportación para análisis externo es posible
- [ ] Caso 7: Generación de reportes es posible

## Troubleshooting

- [ ] Todos los problemas comunes documentados
- [ ] Soluciones verificadas y funcionan
- [ ] Comandos de validación manual funcionan
- [ ] Logs útiles identificados y documentados

## Seguridad

- [ ] No hay API keys hardcodeadas en el código
- [ ] `.env` está en `.gitignore`
- [ ] CORS configurado apropiadamente
- [ ] No hay vulnerabilidades de XSS en el panel de detalles
- [ ] Validación de JSON en el servidor

## Accesibilidad

- [ ] Colores tienen suficiente contraste
- [ ] Leyenda es legible
- [ ] Panel de detalles es legible
- [ ] Botones tienen tamaño adecuado para click
- [ ] Tooltips informativos (si aplica)

## Compatibilidad

- [ ] Funciona en Chrome 90+
- [ ] Funciona en Firefox 88+
- [ ] Funciona en Safari 14+
- [ ] Funciona en Linux
- [ ] Funciona en macOS
- [ ] Funciona en Windows (con WSL)

## Mantenimiento

- [ ] Código comentado donde es necesario
- [ ] Funciones tienen nombres descriptivos
- [ ] No hay código duplicado
- [ ] Dependencias tienen versiones específicas
- [ ] No hay warnings en la consola del navegador
- [ ] No hay warnings en la consola del servidor

## Deployment (Opcional)

- [ ] Variables de entorno configuradas para producción
- [ ] Build del cliente funciona: `npm run build`
- [ ] Archivos estáticos servidos correctamente
- [ ] HTTPS configurado (si aplica)
- [ ] Dominio configurado (si aplica)

## Checklist de Entrega

- [ ] Todos los archivos commiteados a Git
- [ ] README actualizado con instrucciones claras
- [ ] Documentación completa y revisada
- [ ] Tests básicos pasan
- [ ] No hay TODOs pendientes en el código
- [ ] Versión etiquetada en Git (ej. `v1.0.0-grafos`)

## Notas Adicionales

### Comandos Útiles para Verificación

```bash
# Verificar instalación completa
bash setup_grafos.sh

# Test rápido
bash test_grafo.sh

# Validar JSON
jq empty grafo.json

# Ver estadísticas
jq '.entidades | length' grafo.json
jq '.relaciones | length' grafo.json

# Verificar tipos de entidades
jq '.entidades | group_by(.agente) | map({agente: .[0].agente, count: length})' grafo.json

# Verificar relaciones válidas
jq '.relaciones[] | select(.desde as $d | .hacia as $h | [$d, $h] | inside([.entidades[].id]) | not)' grafo.json
```

### Criterios de Éxito

✅ **Mínimo viable:**
- Script genera `grafo.json` válido
- Dashboard muestra el grafo
- Interacciones básicas funcionan

✅ **Completo:**
- Todos los items del checklist marcados
- Documentación completa
- Tests pasan

✅ **Excelente:**
- Performance óptima
- Casos de uso avanzados funcionan
- Código limpio y mantenible

---

**Última actualización:** 3 de abril de 2026  
**Versión del checklist:** 1.0.0
