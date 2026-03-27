import torch
import torchaudio
from audiocraft.models import MAGNeT
from audiocraft.data.audio import audio_write
import os

def generate_sfx():
    print(">> Cargando modelo MAGNeT (audio-magnet-small)...")
    # Usamos el modelo small para que la descarga sea rápida y consuma menos VRAM
    model = MAGNeT.get_pretrained("facebook/audio-magnet-small")
    
    # Configuración básica
    model.set_generation_params(use_sampling=True, top_k=0, top_p=0.9)
    
    descriptions = [
        "heavy rain on a metal roof with distant thunder rumbling",
        "busy city street with traffic, car horns and crowd noise"
    ]
    
    print(f">> Generando {len(descriptions)} efectos de sonido...")
    wav = model.generate(descriptions)
    
    for i, clip in enumerate(wav):
        output_filename = f"sfx_test_{i}"
        audio_write(output_filename, clip.cpu(), model.sample_rate, strategy="loudness", loudness_compressor=True)
        print(f">> Guardado: {output_filename}.wav")

if __name__ == "__main__":
    try:
        generate_sfx()
    except Exception as e:
        print(f"Error durante la generación: {e}")
