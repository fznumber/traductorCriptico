const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const ROOT_PATH = path.resolve(__dirname, '../../');
const WORKSPACES = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];

// 1. Generar Thinking Inicial (Ollama qwen3.5:4b)
app.post('/api/generate-thinking', async (req, res) => {
    const { prompt } = req.body;
    console.log(`>> Generando thinking (Ollama qwen3.5:4b) para: "${prompt}"...`);

    try {
        const response = await fetch('http://localhost:11434/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen3.5:4b',
                messages: [{ role: 'user', content: prompt }],
                stream: false
            })
        });

        const data = await response.json();
        const thinking = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || ""; 

        fs.writeFileSync(path.join(ROOT_PATH, 'thinking.txt'), String(thinking));
        res.json({ success: true, thinking });
    } catch (error) {
        console.error('Error API:', error);
        res.status(500).json({ error: 'Fallo al conectar con Ollama (11434)' });
    }
});

// 2. Ejecutar Fase 1 (Agentes OpenClaw)
app.post('/api/run-phase-1', (req, res) => {
    console.log('>> Iniciando Fase 1 (Orquestación de Agentes)...');
    
    exec('bash ejecutar_fase1.sh', { cwd: ROOT_PATH }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error script: ${error}`);
            return res.status(500).json({ error: 'Error en la ejecución de agentes' });
        }
        res.json({ success: true, log: stdout });
    });
});

// 3. Leer Resultados Finales
app.get('/api/results', (req, res) => {
    const results = {};
    
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
