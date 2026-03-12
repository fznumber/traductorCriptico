#!/bin/bash

# Script de arranque TC2026 - Qwen3.5-9B-PARO (Modo Servidor)
# Basado en la configuración que funcionó en modo chat

export CUDA_HOME=/usr/local/cuda
export PATH=$CUDA_HOME/bin:$PATH
export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH

# Desactivamos V1 para evitar el AssertionError previo
export VLLM_USE_V1=0

echo ">> Iniciando Servidor API TC2026 (9B-PARO)..."
echo ">> Puerto: 8080"

# Cambiamos .chat por .serve para habilitar la API OpenAI compatible
python -m paroquant.cli.serve \
    --model z-lab/Qwen3.5-9B-PARO \
    --port 8080 \
    --trust-remote-code \
    --gpu-memory-utilization 0.8
