import torch
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write

def generar_musica():
    print(">> Cargando el mejor modelo para tu GPU: MusicGen-Medium (1.5B parámetros)...")
    # Cargamos el modelo Medium
    model = MusicGen.get_pretrained("facebook/musicgen-medium")
    
    # Parámetros de la canción
    model.set_generation_params(duration=30)
    
    # Un prompt cinematográfico de alta calidad
    prompt = (
        "Epic cinematic orchestral piece, rising tension, powerful strings, "
        "heavy percussion, brass accents, high quality, studio recording, "
        "dramatic choir in the background"
    )
    
    print(f">> Componiendo la pieza: '{prompt}'...")
    print(">> Iniciando generación (30 segundos)...")
    
    # Generación limpia (Audiocraft manejará el dispositivo CUDA automáticamente)
    with torch.inference_mode():
        wav = model.generate([prompt], progress=True)
    
    # Guardar el resultado
    output_filename = "mi_cancion_epica"
    audio_write(output_filename, wav[0].cpu(), model.sample_rate, strategy="loudness")
    print(f">> ¡Canción generada con éxito!: {output_filename}.wav")

if __name__ == "__main__":
    try:
        generar_musica()
    except Exception as e:
        print(f"Error durante la generación: {e}")
