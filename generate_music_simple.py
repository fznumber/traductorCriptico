"""
Script para generar música con Suno API
Docs: https://docs.sunoapi.org/suno-api/generate-music
"""

import requests
import time
import json

# ─────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────
API_KEY = "bf8efce49ecc914bcbc4835db90763ec"  # Obtén tu key en: https://sunoapi.org/api-key
BASE_URL = "https://api.sunoapi.org/api/v1"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


# ─────────────────────────────────────────
# 1. GENERAR MÚSICA (modo simple)
# ─────────────────────────────────────────
def generate_music_simple(prompt: str) -> str | None:
    """
    Modo más sencillo: solo requiere un prompt.
    La API genera la letra automáticamente.
    """
    payload = {
        "customMode": False,
        "instrumental": False,
        "model": "V4_5ALL",
        "callBackUrl": "https://api.example.com/callback",  # URL de tu servidor (opcional)
        "prompt": prompt,
    }

    print(f"\n🎵 Generando música con prompt: '{prompt}'")
    response = requests.post(f"{BASE_URL}/generate", headers=HEADERS, json=payload)
    data = response.json()

    if data.get("code") == 200:
        task_id = data["data"]["taskId"]
        print(f"✅ Tarea creada. taskId: {task_id}")
        return task_id
    else:
        print(f"❌ Error al generar: {data}")
        return None


# ─────────────────────────────────────────
# 2. GENERAR MÚSICA (modo personalizado)
# ─────────────────────────────────────────
def generate_music_custom(
    title: str,
    style: str,
    prompt: str,
    instrumental: bool = False,
    vocal_gender: str = "f",  # "m" o "f"
    negative_tags: str = "",
) -> str | None:
    """
    Modo personalizado: control total sobre estilo, letra, género vocal, etc.
    """
    payload = {
        "customMode": True,
        "instrumental": instrumental,
        "model": "V4_5ALL",
        "callBackUrl": "https://api.example.com/callback",
        "title": title,
        "style": style,
        "prompt": prompt if not instrumental else "",
        "vocalGender": vocal_gender,
        "negativeTags": negative_tags,
        "styleWeight": 0.75,
        "weirdnessConstraint": 0.3,
    }

    print(f"\n🎸 Generando '{title}' | Estilo: {style}")
    response = requests.post(f"{BASE_URL}/generate", headers=HEADERS, json=payload)
    data = response.json()

    if data.get("code") == 200:
        task_id = data["data"]["taskId"]
        print(f"✅ Tarea creada. taskId: {task_id}")
        return task_id
    else:
        print(f"❌ Error al generar: {data}")
        return None


# ─────────────────────────────────────────
# 3. CONSULTAR ESTADO DE LA TAREA
# ─────────────────────────────────────────
def get_generation_details(task_id: str) -> dict:
    """Consulta el estado y resultado de una generación."""
    response = requests.get(
        f"{BASE_URL}/generate/record-info",
        headers=HEADERS,
        params={"taskId": task_id},
    )
    return response.json()


# ─────────────────────────────────────────
# 4. ESPERAR RESULTADO (polling)
# ─────────────────────────────────────────
def wait_for_result(task_id: str, timeout: int = 300, interval: int = 20) -> dict | None:
    """
    Hace polling hasta que la música esté lista o se agote el tiempo.
    - Stream URL disponible en ~30-40 segundos
    - URL descargable lista en ~2-3 minutos

    Estados posibles:
      PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS,
      CREATE_TASK_FAILED, GENERATE_AUDIO_FAILED, CALLBACK_EXCEPTION, SENSITIVE_WORD_ERROR
    """
    print(f"\n⏳ Esperando resultado para taskId: {task_id}")
    elapsed = 0

    while elapsed < timeout:
        result = get_generation_details(task_id)

        if result.get("code") != 200:
            print(f"❌ Error consultando estado: {result}")
            return None

        data = result.get("data", {})
        status = data.get("status", "PENDING")
        print(f"   Estado: {status} ({elapsed}s)")

        if status == "SUCCESS":
            print("✅ ¡Música generada con éxito!")
            return data

        if status in ("CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "SENSITIVE_WORD_ERROR"):
            print(f"❌ La tarea falló: {status} — {data.get('errorMessage', '')}")
            return None

        if status == "FIRST_SUCCESS":
            print("   🔊 Primera pista lista (esperando la segunda...)")

        time.sleep(interval)
        elapsed += interval

    print("⏰ Tiempo de espera agotado.")
    return None


# ─────────────────────────────────────────
# 5. MOSTRAR RESULTADOS
# ─────────────────────────────────────────
def print_results(data: dict):
    """Muestra las URLs y detalles de las canciones generadas."""
    tracks = data.get("response", {}).get("sunoData", [])
    print(f"\n🎶 Se generaron {len(tracks)} canciones:\n")

    for i, track in enumerate(tracks, 1):
        print(f"  Canción {i}: {track.get('title', 'Sin título')}")
        print(f"  ├─ Audio URL:    {track.get('audioUrl', 'No disponible')}")
        print(f"  ├─ Stream URL:   {track.get('streamAudioUrl', 'No disponible')}")
        print(f"  ├─ Imagen:       {track.get('imageUrl', 'No disponible')}")
        print(f"  ├─ Tags:         {track.get('tags', '?')}")
        print(f"  └─ Duración:     {track.get('duration', '?')}s\n")


# ─────────────────────────────────────────
# MAIN - EJEMPLOS DE USO
# ─────────────────────────────────────────
if __name__ == "__main__":

    print("=" * 50)
    print("  SUNO API - Generador de Música")
    print("=" * 50)

    # ── EJEMPLO 1: Modo simple (recomendado para empezar) ──
    task_id = generate_music_simple(
        prompt="An upbeat Latin pop song about dancing under the stars in Bolivia"
    )

    # ── EJEMPLO 2: Modo personalizado (descomenta para usar) ──
    # task_id = generate_music_custom(
    #     title="Noches de Cochabamba",
    #     style="Latin Pop, Acoustic Guitar, Upbeat",
    #     prompt="[Verse]\nBajo las estrellas cochabambinas\nbailo contigo sin parar\n[Chorus]\nEsta noche es para ti\nestas noches son para mí",
    #     instrumental=False,
    #     vocal_gender="f",
    #     negative_tags="Heavy Metal, Sad, Slow",
    # )

    # ── Esperar y mostrar resultados ──
    if task_id:
        result = wait_for_result(task_id, timeout=300, interval=20)
        if result:
            print_results(result)
        else:
            # Mostrar estado actual aunque no esté completo
            print("\n📋 Estado actual de la tarea:")
            raw = get_generation_details(task_id)
            print(json.dumps(raw, indent=2, ensure_ascii=False))