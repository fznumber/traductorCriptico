# Troubleshooting - Sistema de Grafos de Conocimiento

## Problemas Comunes y Soluciones

### 1. El grafo no aparece en el dashboard

**Síntomas:**
- La pestaña "GRAFO" está deshabilitada
- No se genera el archivo `grafo.json`

**Soluciones:**

a) Verificar que el script completó exitosamente:
```bash
ls -la grafo.json
```

b) Verificar que los agentes produjeron JSON:
```bash
grep -r "json-grafo" workspaces/*/RESULTADO_FASE1.md
```

c) Ejecutar el test de ejemplo:
```bash
bash test_grafo.sh
```

d) Verificar logs del servidor:
```bash
# En la terminal donde corre el servidor, buscar:
# "Grafo no disponible aún"
```

### 2. Error "jq: command not found"

**Síntomas:**
```
bash: jq: command not found
```

**Soluciones:**

Linux:
```bash
sudo apt-get update
sudo apt-get install jq
```

macOS:
```bash
brew install jq
```

### 3. El JSON del grafo está malformado

**Síntomas:**
- Error al cargar el grafo en el dashboard
- Mensaje "Error al cargar el grafo"

**Soluciones:**

a) Validar el JSON manualmente:
```bash
jq empty grafo.json
```

b) Ver el contenido del grafo:
```bash
jq . grafo.json
```

c) Verificar que los agentes produjeron JSON válido:
```bash
for agent in ausencias bifurcaciones grounding neutralizacion; do
  echo "=== $agent ==="
  sed -n '/```json-grafo/,/```/p' workspaces/$agent/RESULTADO_FASE1.md | sed '1d;$d' | jq empty
done
```

### 4. Los nodos no tienen conexiones

**Síntomas:**
- El grafo muestra nodos aislados sin aristas
- Array `relaciones` vacío en `grafo.json`

**Causas:**
- Los agentes no detectaron relaciones entre hallazgos
- Los IDs en las relaciones no coinciden con los IDs de las entidades

**Soluciones:**

a) Verificar IDs:
```bash
jq '.entidades[].id' grafo.json
jq '.relaciones[] | "\(.desde) -> \(.hacia)"' grafo.json
```

b) Los agentes deben crear relaciones explícitas en su JSON. Revisar los prompts en `workspaces/*/IDENTITY.md`.

### 5. D3.js no se carga

**Síntomas:**
- Error en consola del navegador: "d3 is not defined"
- El componente del grafo no renderiza

**Soluciones:**

a) Reinstalar dependencias:
```bash
cd dashboard/client
rm -rf node_modules package-lock.json
npm install
```

b) Verificar que D3 está en package.json:
```bash
grep "d3" dashboard/client/package.json
```

c) Limpiar caché de Vite:
```bash
cd dashboard/client
rm -rf node_modules/.vite
npm run dev
```

### 6. El servidor no sirve el grafo

**Síntomas:**
- Error 404 al acceder a `/api/grafo`
- Mensaje "Grafo no disponible aún"

**Soluciones:**

a) Verificar que el endpoint existe:
```bash
grep -A 5 "app.get('/api/grafo'" dashboard/server/server.js
```

b) Verificar que el servidor está corriendo:
```bash
curl http://localhost:3001/api/grafo
```

c) Verificar la ruta del archivo:
```bash
# El servidor busca grafo.json en ROOT_PATH
# Verificar que ROOT_PATH apunta al directorio correcto
```

### 7. Los colores de los nodos no se muestran correctamente

**Síntomas:**
- Todos los nodos son grises
- Los colores no corresponden a los agentes

**Causas:**
- El campo `agente` en las entidades no coincide con las claves del `colorMap`

**Soluciones:**

a) Verificar valores del campo agente:
```bash
jq '.entidades[].agente' grafo.json | sort | uniq
```

Deben ser exactamente: `ausencias`, `bifurcaciones`, `grounding`, `neutralizacion`

b) Verificar el colorMap en `KnowledgeGraph.tsx`:
```typescript
const colorMap: Record<string, string> = {
  bifurcaciones: '#f59e0b',
  grounding: '#10b981',
  neutralizacion: '#ef4444',
  ausencias: '#8b5cf6'
};
```

### 8. El grafo es demasiado denso o disperso

**Síntomas:**
- Nodos muy juntos o muy separados
- Difícil de leer

**Soluciones:**

Ajustar parámetros de la simulación en `KnowledgeGraph.tsx`:

```typescript
// Para grafos más dispersos:
.force('link', d3.forceLink(links)
  .id((d: any) => d.id)
  .distance(200))  // Aumentar de 120 a 200
.force('charge', d3.forceManyBody().strength(-600))  // Aumentar repulsión

// Para grafos más compactos:
.force('link', d3.forceLink(links)
  .id((d: any) => d.id)
  .distance(80))  // Reducir de 120 a 80
.force('charge', d3.forceManyBody().strength(-200))  // Reducir repulsión
```

### 9. El panel de detalles no se cierra

**Síntomas:**
- El botón X no funciona
- Click en el fondo no deselecciona

**Soluciones:**

a) Verificar que el evento de click en el SVG está configurado:
```typescript
svg.on('click', () => setSelectedNode(null));
```

b) Verificar que el botón tiene el handler:
```typescript
<button 
  className="close-btn"
  onClick={() => setSelectedNode(null)}
>
  ✕
</button>
```

### 10. Performance: el grafo es muy lento

**Síntomas:**
- Lag al mover nodos
- Animaciones entrecortadas

**Soluciones:**

a) Reducir el número de ticks de la simulación:
```typescript
simulation.on('tick', () => {
  // ... código de actualización
}).alphaDecay(0.05);  // Aumentar de 0.0228 (default) a 0.05
```

b) Detener la simulación después de estabilizarse:
```typescript
simulation.on('end', () => {
  console.log('Simulación completada');
});
```

c) Para grafos muy grandes (>100 nodos), considerar:
- Filtrado por agente
- Paginación
- Clustering automático

## Logs Útiles

### Ver logs del script de consolidación:
```bash
bash ejecutar_fase1.sh 2>&1 | tee fase1.log
```

### Ver logs del servidor:
```bash
cd dashboard
npm start 2>&1 | tee server.log
```

### Ver logs del cliente (consola del navegador):
```
F12 > Console
```

## Validación Manual del Pipeline

### 1. Verificar que los IDENTITY.md tienen instrucciones JSON:
```bash
for agent in ausencias bifurcaciones grounding neutralizacion; do
  echo "=== $agent ==="
  grep -c "json-grafo" workspaces/$agent/IDENTITY.md
done
```

Debe mostrar "1" para cada agente.

### 2. Verificar que los resultados contienen JSON:
```bash
for agent in ausencias bifurcaciones grounding neutralizacion; do
  echo "=== $agent ==="
  grep -c "json-grafo" workspaces/$agent/RESULTADO_FASE1.md
done
```

### 3. Extraer y validar JSON de cada agente:
```bash
for agent in ausencias bifurcaciones grounding neutralizacion; do
  echo "=== $agent ==="
  sed -n '/```json-grafo/,/```/p' workspaces/$agent/RESULTADO_FASE1.md | sed '1d;$d' | jq .
done
```

### 4. Verificar el grafo consolidado:
```bash
jq . grafo.json
```

## Contacto y Soporte

Si ninguna de estas soluciones funciona, revisa:
- [ANALISIS_GRAFOS_CONOCIMIENTO.md](ANALISIS_GRAFOS_CONOCIMIENTO.md) - Documentación completa
- [README.md](README.md) - Guía de instalación
- Issues en el repositorio del proyecto
