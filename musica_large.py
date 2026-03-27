import torch
import os
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write

# Truco para evitar la fragmentación de memoria en GPUs de 12GB
os.environ["PYTORCH_ALLOC_CONF"] = "expandable_segments:True"

def generar_grande_optimizado():
    # 1. Limpiar memoria previa
    torch.cuda.empty_cache()
    
    print(">> Cargando MusicGen-Large con optimización de memoria...")
    model = MusicGen.get_pretrained("facebook/musicgen-large")
    
    # 2. Forzar el modelo a FP16 (precisión media) para ahorrar 50% de VRAM
    # En Audiocraft, accedemos al modelo interno a través de .lm
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        model.lm.half() 
        model.lm.to(device)
        print(">> Modelo convertido a FP16 para ahorrar VRAM.")
    
    model.set_generation_params(duration=30)
    
    prompt = "Grand symphony orchestra, dramatic violin solo, high fidelity, cinematic masterpiece"
    
    print(f">> Generando: '{prompt}'...")
    with torch.inference_mode(), torch.autocast(device_type='cuda', dtype=torch.float16):
        wav = model.generate([prompt], progress=True)
    
    audio_write("musica_large_output", wav[0].cpu(), model.sample_rate, strategy="loudness")
    print(">> Guardado: musica_large_output.wav")
    
    # Limpiar al finalizar
    torch.cuda.empty_cache()

if __name__ == "__main__":
    try:
        generar_grande_optimizado()
    except Exception as e:
        print(f"Error crítico: {e}")
        print("\nCONSEJO: Si el error persiste, detén otros procesos que usen la GPU (como vLLM o Ollama).")
