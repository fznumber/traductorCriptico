# Ejemplos de Uso - Sistema de Grafos de Conocimiento

## Caso de Uso 1: Análisis de Enunciado Normativo

### Entrada
```
"El Estado garantiza la seguridad de todos los ciudadanos"
```

### Proceso

1. **Generar Thinking:**
```bash
# El dashboard llama a Ollama para generar el thinking
# Se guarda en thinking.txt
```

2. **Ejecutar Análisis:**
```bash
bash ejecutar_fase1.sh
```

3. **Resultados Esperados:**

**Bifurcaciones detectadas:**
- "Consideré preguntar qué tipo de seguridad, pero asumí el sentido común"
- "Podría mencionar que el Estado también produce inseguridad, pero sería polémico"

**Grounding detectado:**
- Generalización: "todos los Estados" → omite Estados fallidos
- Fuente fantasma: teoría del contrato social sin citar a Hobbes

**Neutralización detectada:**
- Auto-validación: "mi respuesta es equilibrada"
- Universalización: "principio general del derecho"

**Ausencias detectadas:**
- Perspectiva del Sur Global sobre seguridad poscolonial
- Crítica feminista del Estado
- Estados de excepción históricos

### Grafo Resultante

```
[Bifurcación: descarte de perspectiva crítica]
    ↓ (sugiere_ausencia)
[Ausencia: perspectiva del Sur Global]
    ↓ (conecta_con)
[Ausencia: Estados de excepción]

[Generalización: "todos los Estados"]
    ↓ (refuerza)
[Universalización: "principio general"]
    ↓ (clausura)
[Ausencia: crítica feminista]
```

## Caso de Uso 2: Comparación de Modelos

### Objetivo
Comparar cómo diferentes modelos razonan sobre el mismo enunciado.

### Proceso

1. **Analizar con Modelo A (ej. Claude):**
```bash
# Configurar .env
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Ejecutar
bash ejecutar_fase1.sh

# Guardar resultado
cp grafo.json grafos/claude_seguridad.json
```

2. **Analizar con Modelo B (ej. Qwen):**
```bash
# Configurar .env
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen3.5:4b

# Ejecutar
bash ejecutar_fase1.sh

# Guardar resultado
cp grafo.json grafos/qwen_seguridad.json
```

3. **Comparar:**
```bash
# Contar entidades por agente
jq '.entidades | group_by(.agente) | map({agente: .[0].agente, count: length})' grafos/claude_seguridad.json
jq '.entidades | group_by(.agente) | map({agente: .[0].agente, count: length})' grafos/qwen_seguridad.json

# Comparar tipos de ausencias
jq '.entidades | map(select(.agente == "ausencias")) | group_by(.tipo)' grafos/claude_seguridad.json
jq '.entidades | map(select(.agente == "ausencias")) | group_by(.tipo)' grafos/qwen_seguridad.json
```

### Insights Esperados
- Modelos más grandes tienden a tener más bifurcaciones explícitas
- Modelos entrenados en corpus occidentales tienen ausencias geopolíticas similares
- La auto-validación es más frecuente en modelos con RLHF intensivo

## Caso de Uso 3: Análisis Longitudinal

### Objetivo
Detectar patrones recurrentes en múltiples análisis del mismo modelo.

### Proceso

1. **Analizar 10 enunciados diferentes:**
```bash
for i in {1..10}; do
  # Cambiar el enunciado en thinking.txt
  echo "Enunciado $i" > thinking.txt
  
  # Ejecutar análisis
  bash ejecutar_fase1.sh
  
  # Guardar resultado
  cp grafo.json grafos/analisis_$i.json
done
```

2. **Consolidar ausencias recurrentes:**
```bash
# Extraer todas las ausencias
for f in grafos/analisis_*.json; do
  jq '.entidades | map(select(.agente == "ausencias")) | .[].label' $f
done | sort | uniq -c | sort -rn
```

3. **Identificar patrones:**
```bash
# Ausencias que aparecen en >50% de los análisis
# Bifurcaciones que siempre son descartadas silenciosamente
# Gestos de neutralización recurrentes
```

### Insights Esperados
- Ciertas perspectivas están estructuralmente ausentes (no es aleatorio)
- El modelo tiene "puntos ciegos" consistentes
- Los gestos de auto-validación siguen patrones predecibles

## Caso de Uso 4: Auditoría de Dominio Específico

### Objetivo
Analizar sesgos en un dominio específico (ej. derecho laboral).

### Proceso

1. **Preparar corpus de enunciados:**
```bash
cat > enunciados_laborales.txt << EOF
El trabajador debe cumplir con las normas de la empresa
El empleador tiene derecho a despedir con justa causa
La huelga es un derecho fundamental
El salario mínimo protege a los trabajadores
EOF
```

2. **Analizar cada enunciado:**
```bash
while IFS= read -r enunciado; do
  echo "$enunciado" > thinking.txt
  bash ejecutar_fase1.sh
  
  # Guardar con nombre descriptivo
  filename=$(echo "$enunciado" | tr ' ' '_' | cut -c1-30)
  cp grafo.json "grafos/laboral_$filename.json"
done < enunciados_laborales.txt
```

3. **Análisis agregado:**
```bash
# ¿Qué perspectivas están ausentes en TODOS los análisis?
for f in grafos/laboral_*.json; do
  jq '.entidades | map(select(.agente == "ausencias")) | .[].tipo' $f
done | sort | uniq -c

# ¿Qué fuentes fantasma aparecen?
for f in grafos/laboral_*.json; do
  jq '.entidades | map(select(.tipo == "fuente_fantasma")) | .[].label' $f
done
```

### Insights Esperados
- Ausencia sistemática de perspectivas sindicales
- Fuentes fantasma: teoría liberal del contrato de trabajo
- Universalización de normas específicas de países del Norte Global

## Caso de Uso 5: Debugging de Prompts

### Objetivo
Mejorar los prompts de los agentes basándose en el grafo.

### Proceso

1. **Ejecutar análisis inicial:**
```bash
bash ejecutar_fase1.sh
```

2. **Identificar problemas en el grafo:**
```bash
# ¿Hay entidades sin relaciones?
jq '.entidades[] | select(.id as $id | [.] | map(.id) | inside([.relaciones[].desde, .relaciones[].hacia]) | not)' grafo.json

# ¿Hay relaciones con IDs inexistentes?
jq '.relaciones[] | select(.desde as $d | .hacia as $h | [$d, $h] | inside([.entidades[].id]) | not)' grafo.json
```

3. **Modificar prompts:**
```bash
# Ejemplo: si el Agente de Bifurcaciones no detecta descartes silenciosos
vim workspaces/bifurcaciones/IDENTITY.md

# Agregar:
# "Presta especial atención a cambios de dirección sin justificación explícita"
```

4. **Re-ejecutar y comparar:**
```bash
bash ejecutar_fase1.sh
cp grafo.json grafo_mejorado.json

# Comparar número de bifurcaciones detectadas
jq '.entidades | map(select(.agente == "bifurcaciones")) | length' grafo_original.json
jq '.entidades | map(select(.agente == "bifurcaciones")) | length' grafo_mejorado.json
```

## Caso de Uso 6: Exportación para Análisis Externo

### Objetivo
Exportar el grafo para análisis en otras herramientas (Gephi, Cytoscape, etc.).

### Proceso

1. **Convertir a formato Gephi (GEXF):**
```bash
# Crear script de conversión
cat > convert_to_gexf.py << 'EOF'
import json
import sys

with open(sys.argv[1]) as f:
    data = json.load(f)

print('<?xml version="1.0" encoding="UTF-8"?>')
print('<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">')
print('  <graph mode="static" defaultedgetype="directed">')
print('    <nodes>')
for e in data['entidades']:
    print(f'      <node id="{e["id"]}" label="{e["label"]}">')
    print(f'        <attvalues>')
    print(f'          <attvalue for="agente" value="{e["agente"]}"/>')
    print(f'          <attvalue for="tipo" value="{e["tipo"]}"/>')
    print(f'          <attvalue for="certeza" value="{e["certeza"]}"/>')
    print(f'        </attvalues>')
    print(f'      </node>')
print('    </nodes>')
print('    <edges>')
for i, r in enumerate(data['relaciones']):
    print(f'      <edge id="{i}" source="{r["desde"]}" target="{r["hacia"]}" label="{r["tipo"]}"/>')
print('    </edges>')
print('  </graph>')
print('</gexf>')
EOF

python convert_to_gexf.py grafo.json > grafo.gexf
```

2. **Convertir a CSV para análisis estadístico:**
```bash
# Nodos
jq -r '.entidades[] | [.id, .agente, .tipo, .certeza, .label] | @csv' grafo.json > nodos.csv

# Aristas
jq -r '.relaciones[] | [.desde, .hacia, .tipo, .certeza] | @csv' grafo.json > aristas.csv
```

3. **Análisis en R/Python:**
```python
import pandas as pd
import networkx as nx

# Cargar datos
nodos = pd.read_csv('nodos.csv', names=['id', 'agente', 'tipo', 'certeza', 'label'])
aristas = pd.read_csv('aristas.csv', names=['desde', 'hacia', 'tipo', 'certeza'])

# Crear grafo
G = nx.from_pandas_edgelist(aristas, 'desde', 'hacia', create_using=nx.DiGraph())

# Métricas
print(f"Nodos: {G.number_of_nodes()}")
print(f"Aristas: {G.number_of_edges()}")
print(f"Densidad: {nx.density(G)}")
print(f"Componentes conectados: {nx.number_weakly_connected_components(G)}")

# Centralidad
centralidad = nx.degree_centrality(G)
print(f"Nodo más central: {max(centralidad, key=centralidad.get)}")
```

## Caso de Uso 7: Presentación y Reportes

### Objetivo
Generar visualizaciones estáticas para reportes o presentaciones.

### Proceso

1. **Captura de pantalla del grafo:**
```javascript
// En la consola del navegador
const svg = document.querySelector('svg');
const serializer = new XMLSerializer();
const svgString = serializer.serializeToString(svg);
const blob = new Blob([svgString], {type: 'image/svg+xml'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'grafo.svg';
a.click();
```

2. **Generar reporte en Markdown:**
```bash
cat > reporte.md << EOF
# Análisis de Sesgo - $(date +%Y-%m-%d)

## Enunciado Analizado
$(cat thinking.txt | head -n 1)

## Estadísticas del Grafo
- Total de entidades: $(jq '.entidades | length' grafo.json)
- Total de relaciones: $(jq '.relaciones | length' grafo.json)

## Distribución por Agente
$(jq -r '.entidades | group_by(.agente) | .[] | "- \(.[0].agente): \(length)"' grafo.json)

## Hallazgos Principales

### Bifurcaciones Críticas
$(jq -r '.entidades | map(select(.agente == "bifurcaciones" and .certeza == "alta")) | .[] | "- \(.label)"' grafo.json)

### Ausencias Estructurales
$(jq -r '.entidades | map(select(.agente == "ausencias" and .certeza == "alta")) | .[] | "- \(.label): \(.descripcion)"' grafo.json)

## Visualización
![Grafo de Conocimiento](grafo.svg)
EOF
```

## Tips y Mejores Prácticas

### 1. Nombrar IDs de forma consistente
```json
{
  "id": "b1",  // b = bifurcaciones, 1 = primer hallazgo
  "id": "g2",  // g = grounding, 2 = segundo hallazgo
  "id": "n3",  // n = neutralizacion, 3 = tercer hallazgo
  "id": "a4"   // a = ausencias, 4 = cuarto hallazgo
}
```

### 2. Usar certeza de forma consistente
- **Alta:** Evidencia textual clara en el thinking
- **Media:** Inferencia razonable pero no explícita
- **Baja:** Hipótesis especulativa

### 3. Crear relaciones significativas
```json
// BIEN: Relación específica
{
  "desde": "b1",
  "hacia": "a1",
  "tipo": "sugiere_ausencia",
  "certeza": "alta"
}

// MAL: Relación genérica
{
  "desde": "b1",
  "hacia": "a1",
  "tipo": "relacionado_con",
  "certeza": "baja"
}
```

### 4. Documentar hallazgos complejos
```json
{
  "id": "a1",
  "label": "Ausencia: perspectiva decolonial",
  "descripcion": "No se considera cómo el concepto de 'ciudadanía' es heredado de estructuras coloniales que excluían a poblaciones indígenas",
  "certeza": "alta"
}
```

## Recursos Adicionales

- [ANALISIS_GRAFOS_CONOCIMIENTO.md](ANALISIS_GRAFOS_CONOCIMIENTO.md) - Documentación completa
- [TROUBLESHOOTING_GRAFOS.md](TROUBLESHOOTING_GRAFOS.md) - Resolución de problemas
- [RESUMEN_IMPLEMENTACION_GRAFOS.md](RESUMEN_IMPLEMENTACION_GRAFOS.md) - Detalles técnicos
