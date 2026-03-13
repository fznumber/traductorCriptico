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

// 1. Generar Thinking Inicial (Configurable) - ASÍNCRONO para evitar Timeouts
app.post('/api/generate-thinking', async (req, res) => {
    const { prompt } = req.body;
    console.log(`>> Iniciando generación de thinking con ${PROVIDER}...`);

    // Borrar el thinking anterior para que el cliente sepa que está generando uno nuevo
    const thinkingPath = path.join(ROOT_PATH, 'thinking.txt');
    if (fs.existsSync(thinkingPath)) {
        try { fs.unlinkSync(thinkingPath); } catch(e) {}
    }

    // Respondemos de inmediato
    res.json({ success: true, message: 'Generación de thinking iniciada' });

    // Proceso en segundo plano
    (async () => {
        try {
            let response;
            let data;
            let thinking = "";

            if (PROVIDER === 'anthropic') {
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

            if (thinking) {
                fs.writeFileSync(thinkingPath, String(thinking));
                console.log('>> Thinking generado y guardado.');
            }
        } catch (error) {
            console.error('Error generando thinking en segundo plano:', error);
        }
    })();
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
    } else {
        results['thinking'] = "Generando...";
    }

    WORKSPACES.forEach(agent => {
        const filePath = path.join(ROOT_PATH, 'workspaces', agent, 'RESULTADO_FASE1.md');
        if (fs.existsSync(filePath)) {
            results[agent] = fs.readFileSync(filePath, 'utf-8');
        } else {
            results[agent] = "En proceso...";
        }
    });
    
    res.json(results);
});

app.listen(PORT, () => {
    console.log(`\n🦞 TC2026 Dashboard Server running on http://localhost:${PORT}`);
    console.log(`Root Path: ${ROOT_PATH}\n`);
});
