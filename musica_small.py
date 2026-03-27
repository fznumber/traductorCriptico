import torch
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write

def generar_pequeno():
    print(">> Cargando MusicGen-Small (300M parámetros) - Máxima velocidad...")
    model = MusicGen.get_pretrained("facebook/musicgen-small")
    model.set_generation_params(duration=15) 
    
    prompt = "Simple lo-fi hip hop beat, chill vibes, piano melody, vinyl crackle"
    
    print(f">> Generando: '{prompt}'...")
    with torch.inference_mode():
        wav = model.generate([prompt], progress=True)
    
    audio_write("musica_small_output", wav[0].cpu(), model.sample_rate, strategy="loudness")
    print(">> Guardado: musica_small_output.wav")

if __name__ == "__main__":
    try:
        generar_pequeno()
    except Exception as e:
        print(f"Error: {e}")
