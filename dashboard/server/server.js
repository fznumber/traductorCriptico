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
app.use(bodyParser.json({ limit: '50mb' }));

const ROOT_PATH = path.resolve(__dirname, '../../');
const WORKSPACES = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];

// Configuración de proveedores
const PROVIDER = process.env.LLM_PROVIDER || 'ollama';

// 1. Generar Thinking Inicial — SIEMPRE usa Ollama (único modelo que expone chain-of-thought)
app.post('/api/generate-thinking', async (req, res) => {
    const { prompt } = req.body;
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/v1/chat/completions';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
    console.log(`>> Iniciando generación de thinking con Ollama (${OLLAMA_MODEL})...`);

    // Borrar el thinking anterior para que el cliente sepa que está generando uno nuevo
    const thinkingPath = path.join(ROOT_PATH, 'thinking.txt');
    if (fs.existsSync(thinkingPath)) {
        try { fs.unlinkSync(thinkingPath); } catch(e) {}
    }

    // Respondemos de inmediato
    res.json({ success: true, message: 'Generación de thinking iniciada LOCALMENTE' });

    // Proceso en segundo plano — siempre Ollama
    (async () => {
        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
            });
            const data = await response.json();

            const message = data.choices && data.choices[0] && data.choices[0].message;
            let thinking = '';
            if (message) {
                const content = message.content || '';
                const reasoning = message.reasoning_content || message.reasoning || '';
                thinking = reasoning
                    ? `<think>\n${reasoning}\n</think>\n\n${content}`
                    : content;
            }

            if (thinking) {
                fs.writeFileSync(thinkingPath, String(thinking));
                console.log(`>> Thinking generado con Ollama (${OLLAMA_MODEL}) y guardado.`);
            } else {
                console.error('>> Error: Ollama no retornó contenido.', data);
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

// 4. Generar Música de Fondo con ElevenLabs API
app.post('/api/generate-music', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'query requerida' });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes('tu_')) {
        return res.json({ success: false, error: 'Falta configurar ELEVENLABS_API_KEY en .env' });
    }

    console.log(`\n🎵 Iniciando generación de música (ElevenLabs) para: "${query}"`);

    try {
        // Paso 1: Pedirle a Claude que deduzca el prompt de música
        console.log('   >> Consultando a Claude para deducir prompt de música...');
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
                max_tokens: 200,
                messages: [{
                    role: 'user',
                    content: `Eres un compositor musical. Dado el siguiente enunciado crítico o filosófico, genera UN prompt corto (máximo 20 palabras, en inglés) para una pieza instrumental de fondo que capture la tensión, el tono y la atmósfera conceptual del tema.

Describe solo: género musical, mood, tempo e instrumentos principales. Sin comillas, sin explicaciones, solo el prompt.

Enunciado: "${query}"`
                }]
            })
        });
        const claudeData = await claudeRes.json();
        const musicPrompt = claudeData.content && claudeData.content[0] && claudeData.content[0].text
            ? claudeData.content[0].text.trim()
            : `Ambient instrumental, dark and tense, slow tempo, piano and strings, philosophical mood`;

        console.log(`   >> Prompt generado: "${musicPrompt}"`);

        // Paso 2: Llamar a ElevenLabs para generar audio corto (~22s) en un solo request
        console.log('   >> Enviando prompt a ElevenLabs (esperando MP3 stream)...');
        
        // El endpoint /v1/sound-generation sirve perfectamente para música e instrumentales cortos
        const elRes = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: musicPrompt,
                duration_seconds: 22,
                prompt_influence: 0.3
            })
        });

        if (!elRes.ok) {
            const errBody = await elRes.text();
            console.error('   !! Error de ElevenLabs:', errBody);
            return res.json({ success: false, error: 'ElevenLabs API falló', musicPrompt });
        }

        // Paso 3: Guardar el stream MP3 resultante de forma local
        const audioDir = path.join(ROOT_PATH, 'dashboard/client/public/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Usamos un nombre único por query usando timestamp
        const timestamp = Date.now();
        const fileName = `fondo_${timestamp}.mp3`;
        const destPath = path.join(audioDir, fileName);
        
        const destStream = fs.createWriteStream(destPath);
        elRes.body.pipe(destStream);

        destStream.on('finish', () => {
            console.log(`   ✅ Audio guardado en: ${destPath}`);
            // Retornamos la ruta pública manejada por Vite/React
            return res.json({ 
                success: true, 
                audioUrl: `/audio/${fileName}`, 
                musicPrompt 
            });
        });

        destStream.on('error', (err) => {
            console.error('   !! Error guardando archivo:', err);
            return res.json({ success: false, error: 'Fallo al guardar MP3' });
        });

    } catch (err) {
        console.error('Error en /api/generate-music:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Convertir texto a voz (Thinking) con ElevenLabs API
app.post('/api/speak-thinking', async (req, res) => {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'text requerido' });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes('tu_')) {
        return res.json({ success: false, error: 'Falta configurar ELEVENLABS_API_KEY en .env' });
    }

    // Limpiar: Eliminar los tags <think> y su cierre, manteniendo el contenido interior.
    // También limpiamos posibles saltos de línea extra fuertes.
    let cleanText = text.replace(/<\/?think>/gi, '').trim();

    // ElevenLabs tiene un límite de 5000 caracteres por request en su API de TTS estándar.
    if (cleanText.length > 4900) {
        cleanText = cleanText.substring(0, 4900) + '...';
    }

    // Voz por defecto: Adam (voz profunda/masculina)
    const selectedVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB'; 

    console.log(`\n🗣️ Iniciando Text-to-Speech (ElevenLabs) para thinking (${cleanText.length} caracteres). Voice ID: ${selectedVoiceId}`);

    try {
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg'
            },
            body: JSON.stringify({
                text: cleanText,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!elRes.ok) {
            const errBody = await elRes.text();
            console.error('   !! Error de ElevenLabs:', errBody);
            return res.json({ success: false, error: 'ElevenLabs API falló' });
        }

        const audioDir = path.join(ROOT_PATH, 'dashboard/client/public/audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const fileName = `thinking_${timestamp}.mp3`;
        const destPath = path.join(audioDir, fileName);
        
        const destStream = fs.createWriteStream(destPath);
        elRes.body.pipe(destStream);

        destStream.on('finish', () => {
            console.log(`   ✅ Audio guardado en: ${destPath}`);
            return res.json({ 
                success: true, 
                audioUrl: `/audio/${fileName}`
            });
        });

        destStream.on('error', (err) => {
            console.error('   !! Error guardando archivo thinking:', err);
            return res.json({ success: false, error: 'Fallo al guardar MP3' });
        });

    } catch (err) {
        console.error('Error en /api/speak-thinking:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Dictado por voz / Speech-to-Text (ElevenLabs API)
app.post('/api/transcribe', async (req, res) => {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) return res.status(400).json({ success: false, error: 'audioBase64 requerido' });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes('tu_')) {
        return res.json({ success: false, error: 'Falta configurar ELEVENLABS_API_KEY en .env' });
    }

    console.log(`\n🎙️ Procesando audio STT de usuario (mimeType: ${mimeType || 'audio/webm'})...`);

    try {
        const buffer = Buffer.from(audioBase64, 'base64');
        const fileBlob = new Blob([buffer], { type: mimeType || 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', fileBlob, 'audio.webm'); 
        formData.append('model_id', 'scribe_v1');

        const elRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: formData
        });

        if (!elRes.ok) {
            const errBody = await elRes.text();
            console.error('   !! Error STT ElevenLabs:', errBody);
            return res.json({ success: false, error: 'ElevenLabs STT falló' });
        }

        const data = await elRes.json();
        const transcription = data.text;

        console.log(`   ✅ Audio transcrito con éxito: "${transcription}"`);
        return res.json({ success: true, text: transcription });
    } catch (err) {
        console.error('Error en /api/transcribe:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🦞 TC2026 Dashboard Server running on http://localhost:${PORT}`);
    console.log(`Root Path: ${ROOT_PATH}\n`);
});
