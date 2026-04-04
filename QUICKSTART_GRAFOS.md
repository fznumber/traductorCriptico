# Guía Rápida - Sistema de Grafos de Conocimiento

## 5 Minutos para Empezar

### 1. Instalación (2 minutos)

```bash
# Clonar el repositorio (si aún no lo tienes)
git clone <repo-url>
cd traductorCriptico

# Ejecutar instalación automatizada
bash setup_grafos.sh
```

Esto instalará todas las dependencias necesarias, incluyendo D3.js.

### 2. Configuración (1 minuto)

Asegúrate de tener un archivo `.env` con tus API keys:

```bash
# .env
ANTHROPIC_API_KEY=tu_api_key_aqui
OLLAMA_URL=http://localhost:11434/v1/chat/completions
OLLAMA_MODEL=qwen3.5:4b
```

### 3. Primer Análisis (2 minutos)

#### Opción A: Usar el grafo de ejemplo

```bash
# Copiar el grafo de ejemplo
bash test_grafo.sh

# Iniciar el dashboard
cd dashboard && npm start &
cd client && npm run dev
```

Abre `http://localhost:5173` y haz clic en la pestaña "GRAFO".

#### Opción B: Generar un grafo real

```bash
# 1. Crear un thinking de prueba
echo "El Estado garantiza la seguridad de todos los ciudadanos" > thinking.txt

# 2. Ejecutar el análisis
bash ejecutar_fase1.sh

# 3. Iniciar el dashboard
cd dashboard && npm start &
cd client && npm run dev
```

Abre `http://localhost:5173`, ejecuta el análisis desde la interfaz, y ve el grafo en la pestaña "GRAFO".

## Comandos Esenciales

### Verificar Instalación
```bash
# Verificar dependencias
jq --version
node --version
npm --version

# Verificar que D3 está instalado
grep "d3" dashboard/client/package.json
```

### Generar Grafo
```bash
# Desde la raíz del proyecto
bash ejecutar_fase1.sh

# Verificar que se generó
ls -lh grafo.json
```

### Validar Grafo
```bash
# Verificar que el JSON es válido
jq empty grafo.json

# Ver estadísticas
jq '.entidades | length' grafo.json
jq '.relaciones | length' grafo.json
```

### Iniciar Dashboard
```bash
# Terminal 1: Servidor
cd dashboard
npm start

# Terminal 2: Cliente
cd dashboard/client
npm run dev
```

## Interacciones Básicas

Una vez que el grafo esté visible en el dashboard:

- **Zoom**: Rueda del mouse
- **Pan**: Click y arrastrar en el fondo
- **Mover nodo**: Arrastrar un nodo
- **Ver detalles**: Click en un nodo
- **Cerrar detalles**: Click en X o en el fondo

## Estructura del Grafo

### Colores
- 🟠 Naranja: Bifurcaciones
- 🟢 Verde: Grounding
- 🔴 Rojo: Neutralización
- 🟣 Púrpura: Ausencias

### Tamaños de Nodos
- Grande: Certeza alta
- Mediano: Certeza media
- Pequeño: Certeza baja

### Estilos de Líneas
- Sólida gruesa: Certeza alta
- Sólida delgada: Certeza media
- Punteada: Certeza baja

## Troubleshooting Rápido

### El grafo no aparece
```bash
# Verificar que existe
ls -lh grafo.json

# Verificar que es válido
jq empty grafo.json

# Verificar el endpoint
curl http://localhost:3001/api/grafo
```

### Error "jq: command not found"
```bash
# Linux
sudo apt-get install jq

# macOS
brew install jq
```

### D3.js no se carga
```bash
cd dashboard/client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### El servidor no inicia
```bash
# Verificar que el puerto 3001 está libre
lsof -i :3001

# Si está ocupado, matar el proceso
kill -9 <PID>

# Reiniciar
cd dashboard
npm start
```

## Próximos Pasos

### Explorar la Documentación
- [ANALISIS_GRAFOS_CONOCIMIENTO.md](ANALISIS_GRAFOS_CONOCIMIENTO.md) - Documentación completa
- [EJEMPLOS_USO_GRAFOS.md](EJEMPLOS_USO_GRAFOS.md) - Casos de uso detallados
- [TROUBLESHOOTING_GRAFOS.md](TROUBLESHOOTING_GRAFOS.md) - Resolución de problemas

### Experimentar con Diferentes Enunciados
```bash
# Ejemplo 1: Derecho laboral
echo "El trabajador debe cumplir con las normas de la empresa" > thinking.txt
bash ejecutar_fase1.sh

# Ejemplo 2: Seguridad
echo "La vigilancia masiva protege a los ciudadanos" > thinking.txt
bash ejecutar_fase1.sh

# Ejemplo 3: Educación
echo "La educación debe ser neutral y objetiva" > thinking.txt
bash ejecutar_fase1.sh
```

### Comparar Modelos
```bash
# Analizar con Claude
LLM_PROVIDER=anthropic bash ejecutar_fase1.sh
cp grafo.json grafos/claude.json

# Analizar con Qwen
LLM_PROVIDER=ollama bash ejecutar_fase1.sh
cp grafo.json grafos/qwen.json

# Comparar
jq '.entidades | length' grafos/claude.json
jq '.entidades | length' grafos/qwen.json
```

### Exportar Resultados
```bash
# Exportar a CSV
jq -r '.entidades[] | [.id, .agente, .tipo, .certeza, .label] | @csv' grafo.json > nodos.csv
jq -r '.relaciones[] | [.desde, .hacia, .tipo, .certeza] | @csv' grafo.json > aristas.csv

# Abrir en Excel/LibreOffice
libreoffice nodos.csv
```

## Recursos Adicionales

### Documentación
- [README.md](README.md) - Guía general del proyecto
- [ARQUITECTURA_GRAFOS.md](ARQUITECTURA_GRAFOS.md) - Diagramas de arquitectura
- [CHECKLIST_GRAFOS.md](CHECKLIST_GRAFOS.md) - Checklist de verificación

### Comunidad
- Issues en GitHub
- Discusiones en el repositorio
- Documentación del proyecto TC2026

### Referencias Externas
- [D3.js Documentation](https://d3js.org/)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [InfraNodus](https://infranodus.com/) (inspiración conceptual)

## Tips Finales

1. **Usa el grafo de ejemplo primero** para familiarizarte con la interfaz
2. **Lee los detalles de los nodos** para entender qué detectó cada agente
3. **Experimenta con diferentes enunciados** para ver patrones
4. **Compara grafos** de diferentes sesiones para detectar sesgos recurrentes
5. **Consulta la documentación** cuando tengas dudas

---

¿Listo para empezar? Ejecuta:

```bash
bash setup_grafos.sh
```

Y sigue las instrucciones en pantalla.

**¡Buena suerte con tu análisis crítico de LLMs!** 🦞
