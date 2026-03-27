require('dotenv').config({ path: '../../.env' });
const fs = require('fs');

async function testElevenLabs() {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        console.error("❌ Faltan credenciales en .env");
        process.exit(1);
    }

    const musicPrompt = "Ambient instrumental, dark and tense, fast tempo, electronic beats, philosophical mood";
    console.log(`\n🎵 Probando ruta /v1/sound-generation...`);

    try {
        const fetch = require('node-fetch') || globalThis.fetch;
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
            console.error('❌ Error de ElevenLabs:', errBody);
            process.exit(1);
        }

        console.log(`✅ ¡Éxito! Permiso validado y audio generado correctamente.`);

    } catch (err) {
        console.error('❌ Error general:', err);
    }
}

testElevenLabs();
