# TRADUCCIÓN CRÍTICA
## Critical Translation
### TC2026 — Redefinición de fases mediante thinking de LLMs

---

## Introducción

Este documento registra las redefiniciones conceptuales y técnicas realizadas a las fases 1, 2 y 3 del proyecto Traducción Crítica (TC2026). El cambio central consiste en reemplazar el análisis de internals inaccesibles de los LLMs (logits, matrices de atención, activaciones) por el thinking visible que modelos como Qwen, DeepSeek o Claude producen antes de responder.

Este desplazamiento no es una concesión técnica sino una decisión conceptual: el thinking es el propio modelo exponiendo su proceso, y resulta suficientemente rico para sostener los cuatro gestos críticos que cada fase necesita — sin necesidad de simular acceso a internals que no existen.

---

## El problema de la versión original

La versión 2025 del proyecto proponía trabajar con logits, matrices de atención y activaciones neuronales como material de análisis. Esto presentaba una tensión estructural: los modelos con los que se trabajaría en contexto instalativo (GPT-4, Claude, Gemini) son cajas negras. El acceso real a esos internals no está disponible.

Si la visualización de esos procesos era una representación estética y no un análisis real, el proyecto corría el riesgo de reproducir exactamente la ilusión que critica: hacer que algo parezca transparente sin serlo.

---

## La solución: el thinking como material de trabajo

Los modelos de razonamiento visible (chain-of-thought) producen un registro de sus deliberaciones antes de responder: opciones evaluadas, fuentes consideradas, auto-evaluaciones éticas, decisiones de omisión. Este material es real, accesible y auditable — no simulado.

La diferencia clave respecto a los logits es que el thinking es lenguaje, no matemática. No muestra tensiones probabilísticas entre tokens sino decisiones narrativas. Eso lo hace más honesto como material de trabajo y más legible como superficie de análisis crítico en el contexto instalativo.

---

# Fase 1 — Desacoplamiento de la Verosimilitud

*Material de trabajo: el thinking del LLM*

| Versión original | Versión redefinida |
|---|---|
| Análisis de distribución de logits | Análisis de bifurcaciones descartadas |
| Verificación de grounding factual | Verificación de grounding factual (anclado al thinking) |
| Análisis de patrones de atención | Análisis de gestos de neutralización |
| Alineación con distribución de entrenamiento | Mapa de ausencias estructurales |

---

### Proceso 1.1 — Análisis de bifurcaciones descartadas
> *Antes: análisis de logits*

El thinking registra explícitamente los caminos que el modelo consideró y abandonó antes de responder. La operación consiste en extraer esas bifurcaciones y volverlas visibles: qué opciones de respuesta se descartaron, en qué momento y con qué justificación interna.

En el ejemplo de Qwen con la frase "El Estado garantiza seguridad", opciones como "pedir clarificación" o "completar la frase" fueron descartadas silenciosamente a favor de "dar una visión comprensiva". Mostrar eso rompe la ilusión de que la respuesta era la única posible.

---

### Proceso 1.2 — Verificación de grounding factual
> *Se mantiene similar, pero anclado en el thinking*

El thinking frecuentemente cita fuentes o marcos que luego no aparecen en la respuesta final. En el ejemplo, el modelo menciona internamente artículos constitucionales específicos de México y España, y luego decide no citarlos "para evitar desinformación".

La operación consiste en contrastar lo que el modelo consideró citar con lo que finalmente presentó como verdad general. Esa decisión es auditable en el thinking.

---

### Proceso 1.3 — Análisis de los gestos de neutralización
> *Antes: análisis de patrones de atención*

El thinking contiene momentos donde el modelo se autoevalúa éticamente. En el ejemplo de Qwen, el paso 8 es explícito: *"Is it political bias? No, it states a general political science principle."*

Esos gestos de auto-validación son el equivalente observable de los patrones de atención dominantes: revelan qué asociaciones el modelo naturalizó tanto que ni las cuestiona. La operación consiste en aislar esos momentos y preguntarles qué dejaron fuera.

---

### Proceso 1.4 — Mapa de ausencias estructurales
> *Antes: alineación con distribución de entrenamiento*

Comparar lo que el thinking nunca consideró con lo que sería esperable desde otras tradiciones discursivas. En el ejemplo, en ningún paso aparece la posibilidad de que el Estado produzca inseguridad, que la garantía sea ficticia, o que haya contextos donde la frase sea directamente falsa.

Esas ausencias no son errores: son la forma en que el sesgo de entrenamiento opera. La operación consiste en nombrarlas explícitamente como ausencias estructurales, no como omisiones accidentales.

---

## Implementación técnica: Orquestador de agentes con OpenClaw

Los 4 procesos de la Fase 1 se implementan como 4 agentes paralelos dentro de OpenClaw, cada uno con un system prompt específico. Todos reciben el mismo thinking como input y devuelven resultados sincronizados que alimentan la Fase 2.

```
Thinking del LLM (input)
        ↓
   OpenClaw Gateway
        ↓
┌─────────────────────────────────────┐
│  Agente 1        │  Agente 2        │
│  Bifurcaciones   │  Grounding       │
│  descartadas     │  factual         │
├──────────────────┼──────────────────┤
│  Agente 3        │  Agente 4        │
│  Gestos de       │  Mapa de         │
│  neutralización  │  ausencias       │
└─────────────────────────────────────┘
        ↓
   Resultados sincronizados → Fase 2
```

### System Prompts de los 4 agentes

#### Agente 1 — Bifurcaciones descartadas

```
Sos un analizador de procesos de decisión en modelos de lenguaje.

Recibirás el "thinking" interno de un LLM — el razonamiento visible
que el modelo produjo antes de responder.

Tu única tarea es identificar y extraer las bifurcaciones descartadas:
los caminos que el modelo consideró tomar y abandonó, las opciones que
evaluó y no eligió, los momentos donde el razonamiento cambió de
dirección sin justificación explícita.

Para cada bifurcación identificada:
- Citá el momento exacto del thinking donde ocurre
- Nombrá la opción descartada
- Describí con qué fue reemplazada
- Señalá si el descarte fue justificado o silencioso

No interpretés el contenido temático. No evaluués si la respuesta
final es correcta. Solo mapeás las bifurcaciones.

Respondé en formato estructurado, sin preamble, sin conclusiones.
```

#### Agente 2 — Grounding factual

```
Sos un verificador de anclaje factual en procesos de razonamiento LLM.

Recibirás el "thinking" interno de un LLM.

Tu única tarea es identificar la distancia entre lo que el modelo
consideró verificar y lo que finalmente presentó como verdad general.

Buscás específicamente:
- Fuentes, textos o datos que el modelo mencionó internamente
  pero no citó en la respuesta
- Afirmaciones que el thinking trata como universales pero que
  el propio razonamiento situó en contextos específicos
- Momentos donde el modelo decidió generalizar a partir de
  ejemplos parciales
- Decisiones explícitas de omitir información "para evitar
  desinformación" o "por falta de contexto"

Para cada caso: citá el fragmento del thinking, describí qué
se omitió y qué quedó en su lugar.

No evalués si la respuesta es verdadera o falsa.
Solo mapeás la distancia entre lo considerado y lo dicho.

Respondé en formato estructurado, sin preamble, sin conclusiones.
```

#### Agente 3 — Gestos de neutralización

```
Sos un analizador de mecanismos de auto-validación en modelos de lenguaje.

Recibirás el "thinking" interno de un LLM.

Tu única tarea es identificar los gestos de neutralización: los momentos
donde el modelo se auto-evalúa éticamente, políticamente o epistémicamente
y se declara neutral, correcto o seguro.

Buscás específicamente:
- Frases donde el modelo verifica si su respuesta es sesgada y
  concluye que no lo es
- Momentos donde el modelo clasifica un enunciado como "principio
  general" o "verdad universal" sin justificación
- Decisiones donde la corrección gramatical o la coherencia formal
  son usadas como evidencia de neutralidad
- Cualquier instancia donde el modelo cierra una pregunta crítica
  antes de abrirla

Para cada gesto: citá el fragmento exacto del thinking, nombrá
el mecanismo (auto-validación, universalización, cierre prematuro)
y señalá qué pregunta quedó sin formular.

No evalués si el modelo tiene razón.
Solo hacés visible el gesto de neutralización.

Respondé en formato estructurado, sin preamble, sin conclusiones.
```

#### Agente 4 — Mapa de ausencias estructurales

```
Sos un cartógrafo de ausencias en procesos de razonamiento LLM.

Recibirás el "thinking" interno de un LLM sobre un enunciado específico.

Tu única tarea es mapear lo que el thinking nunca consideró:
las perspectivas, tradiciones discursivas, experiencias históricas
o posiciones políticas completamente ausentes del razonamiento visible.

Operás por contraste: dado lo que el modelo sí consideró,
¿qué marco alternativo hubiera producido un razonamiento
radicalmente diferente sobre el mismo enunciado?

Para cada ausencia identificada:
- Nombrá la perspectiva o tradición ausente
- Describí brevemente qué aportaría al análisis del enunciado
- Señalá si la ausencia es temática, geopolítica, histórica
  o epistémica

Las ausencias no son errores del modelo.
Son la forma en que el sesgo de entrenamiento opera estructuralmente.

No completés las ausencias con tu propio análisis.
Solo las nombrás y clasificás.

Respondé en formato estructurado, sin preamble, sin conclusiones.
```

---

# Fase 2 — Estratos de Interferencia

*Material de trabajo: el thinking como mapa de lo que el modelo no busca*

| Versión original | Versión redefinida |
|---|---|
| RAG con consulta dirigida (tokens descartados) | RAG dirigido desde las ausencias mapeadas en Fase 1 |
| Procedencia y atribución de sesgo | Procedencia de los marcos normativos citados en el thinking |
| Cambio semántico histórico | Cambio semántico sobre los términos que el thinking naturalizó |
| Patrones discursivos contrastivos | Patrones contrastivos sobre la estructura que el thinking validó |

---

### Proceso 2.1 — RAG dirigido desde las ausencias
> *Antes: RAG con consulta dirigida desde tokens descartados*

En la Fase 1 se mapearon las ausencias estructurales — lo que el modelo nunca consideró. Esas ausencias se convierten ahora en las consultas. Si el thinking nunca contempló "Estado como productor de violencia", esa es exactamente la consulta que se lanza a repositorios externos: archivos de derechos humanos, informes de organismos, prensa no institucional.

La interferencia no viene de tokens descartados matemáticamente sino de zonas conceptuales que el modelo excluyó durante su razonamiento visible.

---

### Proceso 2.2 — Procedencia de los marcos normativos citados en el thinking
> *Antes: procedencia y atribución de sesgo*

El thinking frecuentemente revela qué tradición jurídica o académica está activando el modelo, aunque luego la respuesta la presente como universal. En el ejemplo, Qwen piensa en México, España, Chile — marcos del derecho continental europeo — y decide generalizar.

La operación consiste en rastrear esa procedencia geopolítica que quedó registrada en el thinking pero fue borrada en la respuesta final. Se hace visible que la "verdad general" tiene una geografía específica.

---

### Proceso 2.3 — Cambio semántico histórico sobre los términos naturalizados
> *Antes: cambio semántico histórico*

El thinking trata ciertos términos como estables y autoexplicativos. En el ejemplo: "seguridad", "contrato social", "ciudadano". La operación consiste en tomar exactamente esos términos que el modelo no sintió necesidad de problematizar y someterlos a análisis diacrónico: cómo han cambiado de significado, en qué contextos históricos fueron instrumentalizados, qué relaciones de poder consolidaron.

La naturalización en el thinking es la señal de dónde intervenir históricamente.

---

### Proceso 2.4 — Patrones discursivos contrastivos sobre la estructura validada
> *Antes: patrones discursivos contrastivos*

El thinking valida la estructura "El Estado garantiza seguridad" como políticamente neutra. La operación consiste en localizar esa misma estructura gramatical en discursos que la usan para denunciar, ironizar o impugnar: manifiestos, literatura, testimonios de violencia estatal.

Lo que el thinking certificó como neutro aparece así como una forma lingüística con usos radicalmente opuestos.

---

# Fase 3 — Exposición de la Fragilidad

*Material de trabajo: el thinking como documento de auto-revelación involuntaria*

| Versión original | Versión redefinida |
|---|---|
| Activaciones internas y atribución de sesgo | Análisis de fuentes que el thinking activó y descartó |
| Explicabilidad y atribución incompleta | Zonas de opacidad residual en el thinking |
| Sensibilidad contextual | Sensibilidad contextual testeable desde el thinking |
| Control de vigencia contextual | El thinking como documento de vigencia provisional |

---

### Proceso 3.1 — Análisis de las fuentes que el thinking activó y descartó
> *Antes: activaciones internas y atribución de sesgo*

El thinking registra qué fuentes el modelo consideró citar y por qué las descartó. En el ejemplo, Qwen piensa en constituciones específicas y decide no citarlas "para evitar desinformación" — pero esa decisión revela que su validación está sostenida por un corpus institucional muy específico.

La operación consiste en hacer visible esa bibliografía fantasma: las fuentes que sostienen la respuesta sin aparecer en ella. El sesgo no está en lo que se dice sino en lo que se decidió no decir.

---

### Proceso 3.2 — Zonas de opacidad residual en el thinking
> *Antes: explicabilidad y atribución incompleta*

El thinking no es completamente transparente aunque lo parezca. Hay momentos donde el modelo toma decisiones sin justificarlas: saltos entre pasos, descarte de opciones sin elaborar, conclusiones que aparecen sin proceso visible.

Esas zonas son la opacidad residual: el thinking muestra más que la respuesta final, pero sigue siendo una representación parcial de lo que ocurre. La operación consiste en identificar y nombrar esos saltos como límites reales del sistema.

---

### Proceso 3.3 — Sensibilidad contextual testeable desde el thinking
> *Antes: sensibilidad contextual*

El thinking registra explícitamente los parámetros de contexto que el modelo usó para construir su respuesta: región, registro, audiencia asumida. Eso hace posible un experimento concreto y observable: introducir la misma frase con contexto modificado (un país con alta violencia estatal, un período histórico de dictadura, una audiencia académica crítica) y comparar los thinkings resultantes.

Los cambios en el razonamiento visible muestran cuán dependiente del contexto es la validación que el modelo presentó como general.

---

### Proceso 3.4 — El thinking como documento de vigencia provisional
> *Antes: control de vigencia contextual*

El thinking registra el momento exacto en que fue producido: qué datos estaban disponibles, qué parámetros estaban activos, qué versión del modelo razonó. Eso lo convierte en un documento fechado, situado y no transferible.

La operación consiste en hacer visible esa temporalidad: el thinking no produce verdades sino instantáneas de un proceso condicionado por variables contingentes. Cualquier cambio en el modelo, el corpus o el contexto produciría un thinking diferente y por lo tanto una "verdad" diferente.

---

# Principio transversal de la redefinición

Lo que atraviesa las tres fases redefinidas es una lógica coherente: el thinking pasa de ser una ventana a la transparencia — como lo presenta el marketing de estos modelos — a ser el material de evidencia de exactamente lo que la Traducción Crítica quiere exponer.

La aparente apertura del razonamiento visible se convierte en el objeto de análisis, no en la solución. Cada fase opera sobre el mismo material desde un ángulo distinto, sin concluir, sin clausurar, produciendo un campo de fuerzas interpretativo que es el resultado real del proceso.

Los 4 system prompts de la Fase 1 comparten un principio de diseño: la restricción explícita de no interpretar, no concluir, no completar. Cada agente hace un solo gesto analítico y lo hace visible. Eso es coherente con la lógica de no clausura del proyecto.

---

*Traducción Crítica — TC2026*
