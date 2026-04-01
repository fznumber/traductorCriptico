# Resumen: Implementación de Enrutamiento de Canales de Audio

Este documento detalla la lógica y características integradas en `App.tsx` para permitir que el Traductor Crítico enrute diferentes pistas de audio (Música de fondo y Voz/Efectos) hacia canales físicos o virtuales distintos, así como su paneo espacial.

## 1. Nueva Interfaz de Configuración de Audio
- Se integró un botón **⚙️ Audio** en la cabecera principal de la aplicación.
- Este botón despliega un panel superpuesto dinámico que divide el control en dos secciones independientes:
  - **Canal: MÚSICA DE FONDO**
  - **Canal: EFECTOS Y VOZ**
- Cada canal expone tres controles principales:
  - **Selector de Salida (Dispositivo):** Menú desplegable para seleccionar la tarjeta de sonido o salida física en la máquina local.
  - **Paneo L/R:** Deslizador espacial de `-1.0` (extremo izquierdo) a `1.0` (extremo derecho).
  - **Volumen:** Deslizador de nivel del 0 al 1.

## 2. Funcionamiento y Arquitectura Subyacente
Para alcanzar el nivel de "máxima flexibilidad" requerido, se implementó un sistema híbrido que combina la detección nativa de hardware con la Web Audio API:

- **Detección de Hardware (Enumerate Devices):**
  - Al abrir el panel de configuración, se solicitan permisos temporales y se lee la API `navigator.mediaDevices.enumerateDevices()`.
  - El sistema extrae específicamente los dispositivos clasificados como `audiooutput` (Ej. auriculares, monitores HDMI, tarjetas locales, o cables de PulseAudio/PipeWire en Linux).
- **Ruteo de Salida (Device Routing) Seguro:**
  - Se emplea la API `setSinkId()` para forzar el flujo de audio estrictamente al dispositivo (`deviceId`) elegido en el panel de UI.
  - Esto evita que la mezcla colisione en el canal *Default / Master* del sistema operativo.
- **Paneo Estéreo con Web Audio API:**
  - Las etiquetas nativas `<audio>` carecen de control de balance estéreo. Para resolver esto, los elementos de audio son interceptados (`createMediaElementSource`) y pasados a través de un nodo `StereoPannerNode` antes de ser inyectados en su respectiva salida de hardware.
  - Se emplean Refs de React (`musicCtxRef`, `effectsCtxRef`) para mantener las conexiones firmes y evitar errores de redibujado.

## 3. Escalabilidad para Múltiples Efectos (Workspaces)
Dado el esquema del proyecto (Fases: Ausencias, Bifurcaciones, Neutralización, Grounding) que requerirán sonidos independientes:
- **Centralización Reutilizable:** Las funciones de configuración vinculan un único contexto de efecto (`effectsCtxRef`). 
- **Integración Futura:** Cuando se implementen sonidos nuevos para cada fase, bastará con aplicarles la misma función de asignación de referencias, garantizando que hereden automáticamente la tarjeta de sonido destino, el paneo y el nivel de volumen ajustados por el usuario para el canal maestro de "EFECTOS Y VOZ".

## 4. Estabilidad y CORS
- **Seguridad en Chromium / Brave:** Para asegurar que Chrome/Brave permita interceptar audios mediante `MediaElementAudioSourceNode` sin bloquear la respuesta por seguridad, se introdujo el atributo de red `crossOrigin="anonymous"` en los reproductores ocultos subyacentes.

---
**Cómo Probar:**
1. Ejecuta `npm run dev` en `./dashboard/client`.
2. Presiona en el panel superior derecho `⚙️ Audio` para listar dispositivos.
3. Elige canales L/R diferentes y Dispositivos de salida distintos.
4. Dicta o procesa una frase y comprueba visual o auditivamente (o usando `pavucontrol` en Linux) que los torrentes de audio fluyen orgánicamente por rutas separadas.
