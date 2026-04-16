const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fetch = require('node-fetch');
const db = require('./db');

const app = express();
const PORT = 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version', 'x-user-name']
}));
app.use(bodyParser.json({ limit: '50mb' }));

const ROOT_PATH = path.resolve(__dirname, '../../');
const WORKSPACES = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];

// --- HELPERS ---
const getUserIdFromHeaders = (req) => {
    const username = req.headers['x-user-name'];
    
    if (!username) {
        console.log('[AUTH] ⚠️ Header x-user-name no proporcionado, usando Invitado por defecto');
        return 4; // Invitado
    }
    
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    if (!user) {
        console.log(`[AUTH] ⚠️ Usuario "${username}" no encontrado, usando Invitado por defecto`);
        return 4; // Invitado
    }
    
    console.log(`[AUTH] ✓ Usuario autenticado: "${username}" (ID: ${user.id})`);
    return user.id;
};

const getEffectiveSessionId = (req) => {
    if (req.body && req.body.sessionId) return req.body.sessionId;
    if (req.query && req.query.sessionId) return req.query.sessionId;
    const userId = getUserIdFromHeaders(req);
    const session = db.prepare('SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
    return session ? session.id : null;
};

// --- RUTAS DE USUARIOS ---
app.get('/api/users', (req, res) => res.json(db.prepare('SELECT * FROM users').all()));

app.post('/api/login', (req, res) => {
    const { username } = req.body;
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'No user' });
    let session = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);
    if (!session) {
        const r = db.prepare('INSERT INTO sessions (user_id, input_prompt) VALUES (?, ?)').run(user.id, 'Sesión inicial');
        session = { id: r.lastInsertRowid, user_id: user.id };
    }
    res.json({ user, session });
});

// --- RUTAS DE SESIONES ---
app.get('/api/sessions', (req, res) => {
    const userId = getUserIdFromHeaders(req);
    const username = req.headers['x-user-name'] || 'Desconocido';
    
    const sessions = db.prepare(`
        SELECT id, input_prompt, created_at, 
               CASE WHEN thinking IS NOT NULL AND thinking != '' THEN 1 ELSE 0 END as has_thinking
        FROM sessions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `).all(userId);
    
    console.log(`[GET SESSIONS] Usuario "${username}" (ID: ${userId}) tiene ${sessions.length} sesiones`);
    res.json(sessions);
});

app.post('/api/sessions/new', (req, res) => {
    const userId = getUserIdFromHeaders(req);
    const { input_prompt } = req.body;
    const result = db.prepare('INSERT INTO sessions (user_id, input_prompt) VALUES (?, ?)').run(userId, input_prompt || 'Nueva sesión');
    res.json({ sessionId: result.lastInsertRowid });
});

app.delete('/api/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const userId = getUserIdFromHeaders(req);
    const username = req.headers['x-user-name'] || 'Desconocido';
    const session = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId);
    
    console.log(`[DELETE SESSION] User "${username}" (ID: ${userId}) intenta eliminar sesión ${sessionId}`);
    
    if (!session) {
        console.log(`[DELETE SESSION] Sesión ${sessionId} no encontrada`);
        return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    if (session.user_id !== userId) {
        const sessionOwner = db.prepare('SELECT username FROM users WHERE id = ?').get(session.user_id);
        console.log(`[DELETE SESSION] ❌ Autorización denegada: sesión pertenece a "${sessionOwner?.username}" (ID: ${session.user_id})`);
        return res.status(403).json({ 
            error: 'No autorizado', 
            message: `Esta sesión pertenece a otro usuario` 
        });
    }
    
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    console.log(`[DELETE SESSION] ✅ Sesión ${sessionId} eliminada exitosamente por "${username}"`);
    res.json({ success: true });
});

// --- UI STATE ---
app.get('/api/ui-state', (req, res) => {
    const sid = getEffectiveSessionId(req);
    if (!sid) return res.json({ layout_data: null });
    const s = db.prepare('SELECT * FROM ui_state WHERE session_id = ? ORDER BY created_at DESC LIMIT 1').get(sid);
    if (s && s.layout_data) s.layout_data = JSON.parse(s.layout_data);
    res.json(s || { layout_data: null });
});

app.post('/api/ui-state', (req, res) => {
    const sid = getEffectiveSessionId(req);
    if (sid) db.prepare('INSERT INTO ui_state (session_id, layout_data, active_view) VALUES (?, ?)').run(sid, JSON.stringify(req.body.layout_data));
    res.json({ success: true });
});

// --- AUDIO CONFIG ---
app.get('/api/audio-config', (req, res) => {
    const sid = getEffectiveSessionId(req);
    if (!sid) return res.json({ 
        music_device_id: 'default', music_pan: 0, music_volume: 1,
        effects_device_id: 'default', effects_pan: 0, effects_volume: 1,
        music_url: null, music_prompt: null
    });
    const config = db.prepare('SELECT * FROM audio_config WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1').get(sid);
    console.log(`[GET AUDIO CONFIG] Sesión ${sid}, config encontrada:`, config ? 'SÍ' : 'NO');
    if (config) {
        console.log(`[GET AUDIO CONFIG] music_url: ${config.music_url}, music_prompt: ${config.music_prompt}`);
    }
    res.json(config || { 
        music_device_id: 'default', music_pan: 0, music_volume: 1,
        effects_device_id: 'default', effects_pan: 0, effects_volume: 1,
        music_url: null, music_prompt: null
    });
});

app.post('/api/audio-config', (req, res) => {
    const sid = getEffectiveSessionId(req);
    if (!sid) return res.status(400).json({ error: 'No session' });
    
    const { music_device_id, music_pan, music_volume, effects_device_id, effects_pan, effects_volume } = req.body;
    
    // Verificar si ya existe configuración para esta sesión
    const existing = db.prepare('SELECT id FROM audio_config WHERE session_id = ?').get(sid);
    
    if (existing) {
        // Actualizar
        db.prepare(`
            UPDATE audio_config 
            SET music_device_id = ?, music_pan = ?, music_volume = ?,
                effects_device_id = ?, effects_pan = ?, effects_volume = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        `).run(music_device_id, music_pan, music_volume, effects_device_id, effects_pan, effects_volume, sid);
    } else {
        // Insertar
        db.prepare(`
            INSERT INTO audio_config 
            (session_id, music_device_id, music_pan, music_volume, effects_device_id, effects_pan, effects_volume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(sid, music_device_id, music_pan, music_volume, effects_device_id, effects_pan, effects_volume);
    }
    
    res.json({ success: true });
});

// --- GENERACIÓN ---

app.post('/api/generate-music', async (req, res) => {
    const { query } = req.body;
    const sid = getEffectiveSessionId(req);
    const API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!API_KEY || API_KEY.includes('tu_')) return res.json({ success: false, error: 'API Key missing' });

    try {
        const musicPrompt = `Cinematic dark ambient for: ${query}`;
        console.log(`[MUSIC] Generando música para: "${musicPrompt}"`);
        
        const elRes = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: musicPrompt, duration_seconds: 22 })
        });
        
        if (!elRes.ok) {
            const errorText = await elRes.text();
            console.error(`[MUSIC] Error de ElevenLabs: ${elRes.status} - ${errorText}`);
            throw new Error(`ElevenLabs API error: ${elRes.status}`);
        }
        
        const fileName = `fondo_${Date.now()}.mp3`;
        const audioDir = path.join(ROOT_PATH, 'dashboard/client/public/audio');
        if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
        
        const destStream = fs.createWriteStream(path.join(audioDir, fileName));
        
        // Manejar errores del stream
        destStream.on('error', (err) => {
            console.error(`[MUSIC] Error escribiendo archivo: ${err.message}`);
            if (!res.headersSent) {
                res.json({ success: false, error: 'Error guardando archivo de audio' });
            }
        });
        
        destStream.on('finish', () => {
            console.log(`[MUSIC] Archivo guardado: ${fileName}`);
            if (sid) {
                // Verificar si ya existe configuración para esta sesión
                const existing = db.prepare('SELECT id FROM audio_config WHERE session_id = ?').get(sid);
                
                if (existing) {
                    // Actualizar música en registro existente
                    db.prepare(`
                        UPDATE audio_config 
                        SET music_prompt = ?, music_url = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE session_id = ?
                    `).run(musicPrompt, `/audio/${fileName}`, sid);
                } else {
                    // Insertar nuevo registro
                    db.prepare('INSERT INTO audio_config (session_id, music_prompt, music_url) VALUES (?, ?, ?)').run(sid, musicPrompt, `/audio/${fileName}`);
                }
            }
            if (!res.headersSent) {
                res.json({ success: true, audioUrl: `/audio/${fileName}`, musicPrompt });
            }
        });
        
        elRes.body.pipe(destStream);
        
    } catch (err) { 
        console.error(`[MUSIC] Error general: ${err.message}`);
        if (!res.headersSent) {
            res.json({ success: false, error: err.message }); 
        }
    }
});

app.post('/api/generate-thinking', async (req, res) => {
    const { prompt } = req.body;
    const uid = getUserIdFromHeaders(req);
    const sid = db.prepare('INSERT INTO sessions (user_id, input_prompt) VALUES (?, ?)').run(uid, prompt).lastInsertRowid;
    
    res.json({ success: true, sessionId: sid });

    (async () => {
        try {
            // FORZAR OLLAMA PARA EL THINKING
            const url = process.env.OLLAMA_URL || 'http://localhost:11434/v1/chat/completions';
            const body = { model: process.env.OLLAMA_MODEL || 'qwen3.5:4b', messages: [{ role: 'user', content: prompt }], stream: false };
            const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const d = await r.json();
            let think = d.choices?.[0]?.message?.content || "";
            if (think) {
                const formatted = think.includes('<think>') ? think : `<think>\n${think}\n</think>`;
                db.prepare('UPDATE sessions SET thinking = ? WHERE id = ?').run(formatted, sid);
                console.log(`[OK] Thinking Sesión ${sid}`);
            }
        } catch (e) { console.error('Thinking Error:', e); }
    })();
});

app.post('/api/run-phase-1', (req, res) => {
    const sid = getEffectiveSessionId(req);
    const session = db.prepare('SELECT thinking FROM sessions WHERE id = ?').get(sid);
    if (!session?.thinking) return res.status(400).json({ error: 'Thinking not ready' });
    
    res.json({ success: true });
    WORKSPACES.forEach(name => ejecutarAgente(sid, name, session.thinking));
});

// Función para obtener definición de agente (personalizada o por defecto)
function getAgentDefinition(sessionId, agentName) {
    // Intentar obtener definición personalizada de la sesión
    const custom = db.prepare('SELECT definition FROM agent_definitions WHERE session_id = ? AND agent_name = ?')
        .get(sessionId, agentName);
    
    if (custom) return custom.definition;
    
    // Si no existe, usar definición por defecto
    const defaultDef = db.prepare('SELECT definition FROM default_agent_definitions WHERE agent_name = ?')
        .get(agentName);
    
    return defaultDef ? defaultDef.definition : '';
}

async function ejecutarAgente(sid, name, thinking) {
    const start = Date.now();
    const PROVIDER = process.env.LLM_PROVIDER;
    
    // Obtener definición desde BD (personalizada o por defecto)
    const instructions = getAgentDefinition(sid, name);
    const p = `IDENTIDAD: ${instructions}\n\nANALIZA ESTE RAZONAMIENTO:\n${thinking}`;

    try {
        let url, model, headers, body;
        if (PROVIDER === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
            headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' };
            body = { model, max_tokens: 4096, messages: [{ role: 'user', content: p }] };
        } else {
            url = process.env.OLLAMA_URL || 'http://localhost:11434/v1/chat/completions';
            model = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
            headers = { 'Content-Type': 'application/json' };
            body = { model, messages: [{ role: 'user', content: p }], stream: false };
        }
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        const d = await r.json();
        const res = (PROVIDER === 'anthropic') ? d.content[0].text : d.choices[0].message.content;
        db.prepare('INSERT INTO agent_logs (session_id, agent_name, result, status, duration_ms, provider, model) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(sid, name, res, 'SUCCESS', Date.now() - start, PROVIDER, model);
        console.log(`[OK] Agente ${name} (${sid})`);
    } catch (e) {
        db.prepare('INSERT INTO agent_logs (session_id, agent_name, result, status) VALUES (?, ?, ?, ?)')
          .run(sid, name, `Error: ${e.message}`, 'FAILED');
    }
}

app.get('/api/results', (req, res) => {
    const sid = getEffectiveSessionId(req);
    if (!sid) return res.json({});
    const s = db.prepare('SELECT thinking FROM sessions WHERE id = ?').get(sid);
    const logs = db.prepare('SELECT agent_name, result FROM agent_logs WHERE session_id = ?').all(sid);
    const resObj = { thinking: s?.thinking || "[ESPERANDO THINKING...]" };
    WORKSPACES.forEach(a => resObj[a] = "[ANALIZANDO...]");
    logs.forEach(l => resObj[l.agent_name] = l.result);
    res.json(resObj);
});

// --- ENDPOINTS DE DEFINICIONES DE AGENTES ---

// Obtener definiciones de agentes para una sesión (personalizadas o por defecto)
app.get('/api/agent-definitions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const definitions = {};
    
    WORKSPACES.forEach(agentName => {
        definitions[agentName] = getAgentDefinition(sessionId, agentName);
    });
    
    res.json(definitions);
});

// Obtener definición de un agente específico
app.get('/api/agent-definitions/:sessionId/:agentName', (req, res) => {
    const { sessionId, agentName } = req.params;
    
    if (!WORKSPACES.includes(agentName)) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    
    const definition = getAgentDefinition(sessionId, agentName);
    res.json({ agentName, definition });
});

// Actualizar definición de un agente para una sesión específica
app.post('/api/agent-definitions/:sessionId/:agentName', (req, res) => {
    const { sessionId, agentName } = req.params;
    const { definition } = req.body;
    
    if (!WORKSPACES.includes(agentName)) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    
    if (!definition || typeof definition !== 'string') {
        return res.status(400).json({ error: 'Definición inválida' });
    }
    
    try {
        // Insertar o actualizar definición personalizada
        db.prepare(`
            INSERT INTO agent_definitions (session_id, agent_name, definition)
            VALUES (?, ?, ?)
            ON CONFLICT(session_id, agent_name) 
            DO UPDATE SET definition = excluded.definition, created_at = CURRENT_TIMESTAMP
        `).run(sessionId, agentName, definition);
        
        res.json({ success: true, agentName, sessionId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Resetear definición de un agente a su valor por defecto
app.delete('/api/agent-definitions/:sessionId/:agentName', (req, res) => {
    const { sessionId, agentName } = req.params;
    
    if (!WORKSPACES.includes(agentName)) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    
    try {
        db.prepare('DELETE FROM agent_definitions WHERE session_id = ? AND agent_name = ?')
            .run(sessionId, agentName);
        
        res.json({ success: true, message: 'Definición reseteada a valor por defecto' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Obtener todas las definiciones por defecto
app.get('/api/default-agent-definitions', (req, res) => {
    const defaults = db.prepare('SELECT agent_name, definition FROM default_agent_definitions').all();
    const result = {};
    defaults.forEach(d => result[d.agent_name] = d.definition);
    res.json(result);
});

app.listen(PORT, () => console.log(`🚀 SERVER ONLINE`));
