const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Configuración de CORS abierta para túneles públicos
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version']
}));
app.use(bodyParser.json());

const ROOT_PATH = path.resolve(__dirname, '../../');
const WORKSPACES = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];

// Configuración de proveedores
const PROVIDER = process.env.LLM_PROVIDER || 'ollama';

// 1. Generar Thinking Inicial (Configurable)
app.post('/api/generate-thinking', async (req, res) => {
    const { prompt } = req.body;
    console.log(`>> Generando thinking con ${PROVIDER} para: "${prompt}"...`);

    try {
        let response;
        let data;
        let thinking = "";

        if (PROVIDER === 'anthropic') {
            // Configuración para Claude
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            data = await response.json();
            thinking = data.content && data.content[0] && data.content[0].text || "";
        } else {
            // Configuración por defecto para Ollama
            response = await fetch(process.env.OLLAMA_URL || 'http://localhost:11434/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: process.env.OLLAMA_MODEL || 'qwen3.5:4b',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
            });
            data = await response.json();
            thinking = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
        }

        if (!thinking && data.error) {
            throw new Error(JSON.stringify(data.error));
        }

        fs.writeFileSync(path.join(ROOT_PATH, 'thinking.txt'), String(thinking));
        res.json({ success: true, thinking });
    } catch (error) {
        console.error('Error API:', error);
        res.status(500).json({ error: `Fallo al conectar con ${PROVIDER}: ${error.message}` });
    }
});

// 2. Ejecutar Fase 1 (Agentes OpenClaw) - ASÍNCRONO para evitar Timeouts
app.post('/api/run-phase-1', (req, res) => {
    console.log('>> Iniciando Fase 1 (Orquestación de Agentes)...');
    
    // Limpiar resultados anteriores para que el polling detecte que el proceso es nuevo
    WORKSPACES.forEach(agent => {
        const filePath = path.join(ROOT_PATH, 'workspaces', agent, 'RESULTADO_FASE1.md');
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch(e) {}
        }
    });

    // Respondemos inmediatamente al cliente
    res.json({ success: true, message: 'Proceso iniciado en segundo plano' });

    // Ejecutamos el script sin esperar a que termine para la respuesta HTTP
    exec('bash ejecutar_fase1.sh', { cwd: ROOT_PATH }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error script: ${error}`);
            return;
        }
        console.log('>> Fase 1 completada exitosamente.');
    });
});

// 3. Leer Resultados Finales
app.get('/api/results', (req, res) => {
    const results = {};
    
    // Incluir thinking inicial
    const thinkingPath = path.join(ROOT_PATH, 'thinking.txt');
    if (fs.existsSync(thinkingPath)) {
        results['thinking'] = fs.readFileSync(thinkingPath, 'utf-8');
    }

    WORKSPACES.forEach(agent => {
        const filePath = path.join(ROOT_PATH, 'workspaces', agent, 'RESULTADO_FASE1.md');
        if (fs.existsSync(filePath)) {
            results[agent] = fs.readFileSync(filePath, 'utf-8');
        } else {
            results[agent] = `Esperando resultado de ${agent}...`;
        }
    });
    
    res.json(results);
});

app.listen(PORT, () => {
    console.log(`\n🦞 TC2026 Dashboard Server running on http://localhost:${PORT}`);
    console.log(`Root Path: ${ROOT_PATH}\n`);
});
