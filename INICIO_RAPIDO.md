# 🚀 Guía de Inicio Rápido

## Primera Vez (Setup Inicial)

### 1. Ejecutar script de setup
```bash
chmod +x setup.sh
./setup.sh
```

Este script automáticamente:
- ✓ Verifica Node.js
- ✓ Verifica e inicia Ollama
- ✓ Descarga modelo qwen3.5:4b
- ✓ Crea archivo .env desde .env.example
- ✓ Instala dependencias del backend
- ✓ Instala dependencias del frontend
- ✓ Crea directorios necesarios

### 2. Configurar API Keys

Edita el archivo `.env` y agrega tus API keys:

```bash
nano .env  # o usa tu editor favorito
```

**Requerido:**
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ELEVENLABS_API_KEY=xxxxxxxxxxxxx
```

**Opcional (solo si usas NVIDIA para thinking):**
```bash
THINKING_PROVIDER=nvidia
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxx
```

### 3. Iniciar la aplicación

**Opción A - Script automático (recomendado):**
```bash
chmod +x start.sh
./start.sh
```

**Opción B - Manual (dos terminales):**

Terminal 1:
```bash
cd dashboard/server
node server.js
```

Terminal 2:
```bash
cd dashboard/client
npm run dev
```

### 4. Abrir en el navegador

```
http://localhost:5173
```

---

## Ejecuciones Posteriores

Una vez completado el setup inicial, solo necesitas:

```bash
./start.sh
```

O manualmente en dos terminales como se indicó arriba.

---

## Primer Uso de la Aplicación

### 1. Seleccionar Usuario
- Al abrir la app, verás 4 usuarios: Diego, Claudia, Ariel, Invitado
- Haz click en uno para iniciar sesión

### 2. Ejecutar Primer Análisis

**Paso 1:** Escribe un enunciado normativo
```
Ejemplo: "El Estado garantiza la seguridad ciudadana"
```

**Paso 2:** Haz click en "ANALIZAR"
- Se generará el thinking (razonamiento inicial)
- Se generará música de fondo automáticamente
- Se ejecutarán los 4 agentes de Fase 1

**Paso 3:** Espera a que termine Fase 1 (~30-60 segundos)

**Paso 4 (Opcional):** Ejecutar Fase 2
- Haz click en "FASE 2"
- Se ejecutarán 4 agentes adicionales

**Paso 5 (Opcional):** Ejecutar Fase 3
- Haz click en "FASE 3"
- Se ejecutarán los últimos 4 agentes

### 3. Explorar Resultados

- **Pestañas superiores:** Cambia entre Thinking y resultados de cada agente
- **Panel lateral izquierdo:** Lista de sesiones anteriores
- **Botón de configuración (⚙️):** Personaliza agentes, música y audio

---

## Configuración Opcional

### Personalizar Template de Música

1. Haz click en el icono de configuración (⚙️)
2. Busca "Instrucción de Generación"
3. Edita el template (usa `{prompt}` para el texto del usuario)
4. Ejemplo: `"upbeat rhythmic ambient music"`
5. Se guarda automáticamente

### Personalizar Agentes

1. Haz click en el icono de configuración (⚙️)
2. Busca el agente que quieres personalizar
3. Haz click en "Ver"
4. Edita las instrucciones
5. Haz click en "Guardar"

### Configurar Audio

1. Haz click en el icono de configuración (⚙️)
2. Configura:
   - Dispositivo de salida para música
   - Dispositivo de salida para efectos/voz
   - Paneo (L/R)
   - Volumen

---

## Solución Rápida de Problemas

### "API Key missing"
```bash
# Edita .env y agrega tus API keys
nano .env
# Reinicia el servidor
```

### "Ollama connection refused"
```bash
# Inicia Ollama
ollama serve
```

### "Port already in use"
```bash
# Detén procesos anteriores
pkill -f "node server.js"
pkill -f "vite"
```

### No se genera música
- Verifica que `ELEVENLABS_API_KEY` es válida
- Verifica que tienes créditos en ElevenLabs
- Revisa los logs del servidor

### Agentes no se ejecutan
- Verifica que `ANTHROPIC_API_KEY` es válida
- Espera a que el thinking termine antes de ejecutar Fase 1

---

## Comandos Útiles

### Ver logs del servidor
```bash
cd dashboard/server
node server.js
# Los logs aparecen en la consola
```

### Resetear base de datos
```bash
cd dashboard/server
rm tc2026.db
node server.js  # Se crea nueva BD automáticamente
```

### Ver base de datos
```bash
cd dashboard/server
sqlite3 tc2026.db
.tables
SELECT * FROM sessions;
.quit
```

### Actualizar dependencias
```bash
# Backend
cd dashboard/server
npm update

# Frontend
cd dashboard/client
npm update
```

---

## Estructura de Archivos Importantes

```
.
├── .env                    # ⚠️ TUS API KEYS (no subir a git)
├── setup.sh               # Script de instalación inicial
├── start.sh               # Script para iniciar la app
├── README.md              # Documentación completa
├── INICIO_RAPIDO.md       # Esta guía
├── dashboard/
│   ├── server/
│   │   ├── server.js      # Backend principal
│   │   └── tc2026.db      # Base de datos (se crea automáticamente)
│   └── client/
│       └── src/
│           └── App.tsx    # Frontend principal
└── workspaces/            # Definiciones de los 12 agentes
```

---

## Obtener API Keys

### Anthropic (Claude)
1. Ve a: https://console.anthropic.com/
2. Crea una cuenta
3. Ve a "API Keys"
4. Crea una nueva key
5. Copia y pega en `.env`

### ElevenLabs
1. Ve a: https://elevenlabs.io/
2. Crea una cuenta
3. Ve a "Profile" → "API Keys"
4. Copia tu key
5. Pega en `.env`

### NVIDIA (Opcional)
1. Ve a: https://build.nvidia.com/
2. Crea una cuenta
3. Genera una API key
4. Pega en `.env`

---

## Próximos Pasos

Una vez que la aplicación esté funcionando:

1. **Experimenta con diferentes enunciados normativos**
2. **Personaliza los agentes** según tus necesidades
3. **Ajusta el template de música** para diferentes ambientes
4. **Explora las 3 fases** de análisis
5. **Revisa la documentación completa** en `README.md`

---

## Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Revisa la consola del navegador (F12)
3. Consulta `README.md` para documentación detallada
4. Revisa los archivos `DEBUG_*.md` para problemas específicos

---

## Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Node.js instalado (v18+)
- [ ] Ollama instalado y corriendo (si usas thinking local)
- [ ] Modelo qwen3.5:4b descargado
- [ ] Archivo `.env` existe y tiene API keys válidas
- [ ] Dependencias instaladas (`node_modules` existe en server y client)
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5173
- [ ] No hay errores en logs del servidor
- [ ] No hay errores en consola del navegador

---

¡Listo! Ya puedes empezar a usar TC2026 🎉
