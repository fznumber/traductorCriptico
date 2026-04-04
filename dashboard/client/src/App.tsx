import { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Loader, Music, Mic } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';

const getApiBase = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return 'http://localhost:3001/api';
  return import.meta.env.VITE_API_BASE || '/api';
};

const API_BASE = getApiBase();

function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState('');
  const [results, setResults] = useState<any>({});
  const [activeTab, setActiveTab] = useState('thinking');
  const [grafoUrl, setGrafoUrl] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicPrompt, setMusicPrompt] = useState<string | null>(null);
  const [musicStatus, setMusicStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Audio Settings State ---
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [musicDeviceId, setMusicDeviceId] = useState<string>('default');
  const [musicPan, setMusicPan] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);
  
  const [effectsDeviceId, setEffectsDeviceId] = useState<string>('default');
  const [effectsPan, setEffectsPan] = useState(0);
  const [effectsVolume, setEffectsVolume] = useState(1);

  const musicCtxRef = useRef<AudioContext | null>(null);
  const musicPannerRef = useRef<StereoPannerNode | null>(null);
  const effectsCtxRef = useRef<AudioContext | null>(null);
  const effectsPannerRef = useRef<StereoPannerNode | null>(null);

  const [thinkingAudioUrl, setThinkingAudioUrl] = useState<string | null>(null);
  const [isThinkingAudioLoading, setIsThinkingAudioLoading] = useState(false);
  const [thinkingAudioError, setThinkingAudioError] = useState<string | null>(null);
  const thinkingAudioRef = useRef<HTMLAudioElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const addLog = (msg: string) => setLog(prev => prev + msg + '\n');

  // --- Audio Enumerate Devices ---
  const fetchAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices) return;
      // Pedimos permiso de mic para asegurar que se muestren los labels de los dispositivos
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        // Ignoramos si deniega permiso, solo leemos los dispositivos disponibles
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      setAudioDevices(outputs);
    } catch (err) {
      console.error('Error enumerando dispositivos de audio:', err);
    }
  };

  // --- Funciones para enlazar Web Audio y Aplicar Settings ---
  const applyAudioSettings = (
    audioElement: HTMLAudioElement,
    ctxRef: React.MutableRefObject<AudioContext | null>,
    pannerRef: React.MutableRefObject<StereoPannerNode | null>,
    deviceId: string,
    pan: number,
    volume: number
  ) => {
    if (!audioElement) return;
    
    // Config volumen nativo siempre
    audioElement.volume = volume;

    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      if (!Ctx) {
        // Fallback: solo setSinkId en HTMLAudioElement si WebAudio no está
        if ('setSinkId' in audioElement) {
          (audioElement as any).setSinkId(deviceId).catch((e:any) => console.log('Sink Error', e));
        }
        return;
      }

      // Inicializar una sola vez
      if (!ctxRef.current) {
        ctxRef.current = new Ctx();
        const source = ctxRef.current.createMediaElementSource(audioElement);
        pannerRef.current = ctxRef.current.createStereoPanner();
        source.connect(pannerRef.current);
        pannerRef.current.connect(ctxRef.current.destination);
      }

      // Aplicar pan
      if (pannerRef.current) {
        pannerRef.current.pan.value = pan;
      }

      // Aplicar Sink (Dispositivo) en AudioContext si el navegador lo soporta (Chrome 110+)
      if ('setSinkId' in ctxRef.current) {
        (ctxRef.current as any).setSinkId(deviceId).catch((e:any) => console.log('Ctx Sink Error', e));
      } else if ('setSinkId' in audioElement) {
        // Fallback a HTMLAudioElement
        (audioElement as any).setSinkId(deviceId).catch((e:any) => console.log('Audio Sink Error', e));
      }
    } catch (e) {
      // Si la fuente ya estaba conectada u otro error, aplicamos fallback seguro
      if ('setSinkId' in audioElement) {
        (audioElement as any).setSinkId(deviceId).catch(() => {});
      }
    }
  };

  // Re-aplicar configuraciones cuando cambian
  useEffect(() => {
    if (audioRef.current) {
      applyAudioSettings(audioRef.current, musicCtxRef, musicPannerRef, musicDeviceId, musicPan, musicVolume);
    }
  }, [musicUrl, musicDeviceId, musicPan, musicVolume]);

  useEffect(() => {
    if (thinkingAudioRef.current) {
      applyAudioSettings(thinkingAudioRef.current, effectsCtxRef, effectsPannerRef, effectsDeviceId, effectsPan, effectsVolume);
    }
  }, [thinkingAudioUrl, effectsDeviceId, effectsPan, effectsVolume]);

  const runPipeline = async () => {
    if (!prompt) return;

    // Reset
    setStatus('generating');
    setMusicUrl(null);
    setMusicPrompt(null);
    setMusicStatus('generating');
    setThinkingAudioUrl(null);
    setThinkingAudioError(null);
    setLog(`>> Iniciando proceso crítico para: "${prompt}"\n`);
    setResults({ thinking: 'Generando...' });
    setActiveTab('thinking');

    try {
      // ── PASO 1: Generar música (bloqueante, espera respuesta del servidor) ──
      addLog('>> 🎵 Componiendo música de fondo para esta consulta...');
      const musicRes = await fetch(`${API_BASE}/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      });
      const musicData = await musicRes.json();

      if (musicData.success && musicData.audioUrl) {
        setMusicUrl(musicData.audioUrl);
        setMusicPrompt(musicData.musicPrompt);
        setMusicStatus('ready');
        addLog(`>> 🎶 Música lista. Reproduciendo...`);
        addLog(`   (tema: ${musicData.musicPrompt})`);
        // Auto-play
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }, 300);
      } else {
        setMusicStatus('error');
        addLog(`>> ⚠️  Música no disponible (${musicData.error || 'sin URL'}). Continuando sin audio.`);
      }

      // ── PASO 2: Generar Thinking ──
      addLog('>> Solicitando Thinking a Claude (segundo plano)...');
      await fetch(`${API_BASE}/generate-thinking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      // Polling del Thinking
      const checkThinking = setInterval(async () => {
        const resRes = await fetch(`${API_BASE}/results`);
        const data = await resRes.json();

        if (data.thinking && data.thinking !== 'Generando...') {
          clearInterval(checkThinking);
          addLog('>> Thinking capturado exitosamente.');
          setResults((prev: any) => ({ ...prev, ...data }));
          startPhase1();
        }
      }, 3000);

      // ── PASO 3: Orquestar Fase 1 ──
      const startPhase1 = async () => {
        setStatus('processing');
        addLog('>> Orquestando 4 agentes en OpenClaw...');

        await fetch(`${API_BASE}/run-phase-1`, { method: 'POST' });

        const pollInterval = setInterval(async () => {
          try {
            const resRes = await fetch(`${API_BASE}/results`);
            const data = await resRes.json();
            setResults((prev: any) => ({ ...prev, ...data }));

            const anyInProgress = Object.values(data).some(val =>
              String(val) === 'En proceso...' || String(val) === 'Generando...'
            );
            const anyFailed = Object.values(data).some(val =>
              String(val).startsWith('### ERROR DE ANÁLISIS')
            );

            if (!anyInProgress) {
              clearInterval(pollInterval);
              setStatus('completed');
              addLog(anyFailed
                ? '>> El análisis ha terminado, pero algunos agentes reportaron errores.'
                : '>> ✅ Todos los agentes han finalizado el análisis correctamente.'
              );
              
              // Cargar el grafo de conocimiento
              const grafoRes = await fetch(`${API_BASE}/grafo`);
              if (grafoRes.ok) {
                setGrafoUrl(`${API_BASE}/grafo`);
                addLog('>> 🕸️  Grafo de conocimiento generado y disponible.');
              }
            }
          } catch (e) {
            console.error('Error polling:', e);
          }
        }, 3000);

        setTimeout(() => clearInterval(pollInterval), 300000);
      };

    } catch (err: any) {
      addLog(`!! Error: ${err.message}`);
      setStatus('idle');
      setMusicStatus('idle');
    }
  };

  const handleSpeakThinking = async () => {
    if (!results.thinking) return;
    setIsThinkingAudioLoading(true);
    setThinkingAudioError(null);
    setThinkingAudioUrl(null);
    try {
      const res = await fetch(`${API_BASE}/speak-thinking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: results.thinking })
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        setThinkingAudioUrl(data.audioUrl);
        setTimeout(() => {
          if (thinkingAudioRef.current) {
            thinkingAudioRef.current.play().catch(() => {});
          }
        }, 300);
      } else {
        setThinkingAudioError(data.error || 'Error al generar voz');
      }
    } catch (err: any) {
      setThinkingAudioError(err.message);
    } finally {
      setIsThinkingAudioLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          setIsTranscribing(true);
          
          stream.getTracks().forEach(track => track.stop());

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (!base64data) {
              setIsTranscribing(false);
              return;
            }

            try {
              const res = await fetch(`${API_BASE}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  audioBase64: base64data, 
                  mimeType: mediaRecorder.mimeType 
                })
              });
              const data = await res.json();
              if (data.success && data.text) {
                setPrompt(data.text);
              } else {
                addLog('>> ⚠️ Error al transcribir: ' + (data.error || 'Desconocido'));
              }
            } catch (err: any) {
              addLog('>> ⚠️ Error de conexión STT: ' + err.message);
            } finally {
              setIsTranscribing(false);
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error de micrófono:', err);
        addLog('>> ⚠️ Error al acceder al micrófono. Da permisos e intenta de nuevo.');
      }
    }
  };

  const isRunning = status === 'generating' || status === 'processing';

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <Terminal size={24} />
          <h1 style={{ fontSize: '18px', margin: 0 }}>TC2026 / TRADUCTOR CRÍTICO</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            className="config-btn"
            onClick={() => {
              if (!showAudioSettings) fetchAudioDevices();
              setShowAudioSettings(!showAudioSettings);
            }}
            title="Configuración de Canales de Audio"
          >
             ⚙️ Audio
          </button>
          <div className="status-badge">
            {isRunning && <Loader className="spin" size={14} />}
            {status.toUpperCase()}
          </div>
        </div>
      </header>

      <main>
        {/* PANEL DE CONFIGURACIÓN DE AUDIO */}
        {showAudioSettings && (
          <div className="audio-settings-panel">
            <div className="settings-section">
              <h4>Canal: MÚSICA DE FONDO</h4>
              <label>Salida: 
                <select value={musicDeviceId} onChange={e => setMusicDeviceId(e.target.value)}>
                  <option value="default">Por Defecto</option>
                  {audioDevices.map(d => <option key={`m-${d.deviceId}`} value={d.deviceId}>{d.label || 'Dispositivo ' + d.deviceId.slice(0,5)}</option>)}
                </select>
              </label>
              <label className="slider-label">Paneo L/R:
                <input type="range" min="-1" max="1" step="0.1" value={musicPan} onChange={e => setMusicPan(parseFloat(e.target.value))} />
                <span>{musicPan}</span>
              </label>
              <label className="slider-label">Volumen:
                <input type="range" min="0" max="1" step="0.1" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} />
                <span>{musicVolume}</span>
              </label>
            </div>
            <div className="settings-section effects-section">
              <h4>Canal: EFECTOS Y VOZ</h4>
              <label>Salida: 
                <select value={effectsDeviceId} onChange={e => setEffectsDeviceId(e.target.value)}>
                  <option value="default">Por Defecto</option>
                  {audioDevices.map(d => <option key={`e-${d.deviceId}`} value={d.deviceId}>{d.label || 'Dispositivo ' + d.deviceId.slice(0,5)}</option>)}
                </select>
              </label>
              <label className="slider-label">Paneo L/R:
                <input type="range" min="-1" max="1" step="0.1" value={effectsPan} onChange={e => setEffectsPan(parseFloat(e.target.value))} />
                <span>{effectsPan}</span>
              </label>
              <label className="slider-label">Volumen:
                <input type="range" min="0" max="1" step="0.1" value={effectsVolume} onChange={e => setEffectsVolume(parseFloat(e.target.value))} />
                <span>{effectsVolume}</span>
              </label>
            </div>
          </div>
        )}

        <div className="input-panel">
          <input
            type="text"
            placeholder="Introduce enunciado normativo (ej. 'El Estado garantiza seguridad')..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isRunning && runPipeline()}
            disabled={isRunning || isRecording || isTranscribing}
          />
          <button 
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={isRunning || isTranscribing}
            title="Dictar consulta con tu voz"
          >
            {isTranscribing ? <Loader className="spin" size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={runPipeline} disabled={isRunning || isRecording || isTranscribing}>
            <Play size={16} /> ANALIZAR
          </button>
        </div>

        {/* ── Player de Música ── */}
        {musicStatus !== 'idle' && (
          <div className="music-bar">
            <div className="music-icon-area">
              {musicStatus === 'generating' && <Loader className="spin" size={14} />}
              {musicStatus === 'ready' && <Music size={14} />}
              {musicStatus === 'error' && <span style={{ fontSize: '14px' }}>⚠</span>}
            </div>
            <div className="music-info">
              {musicStatus === 'generating' && (
                <span className="music-label generating">Componiendo música de fondo...</span>
              )}
              {musicStatus === 'ready' && musicPrompt && (
                <span className="music-label ready" title={musicPrompt}>
                  🎵 {musicPrompt.length > 60 ? musicPrompt.slice(0, 60) + '…' : musicPrompt}
                </span>
              )}
              {musicStatus === 'error' && (
                <span className="music-label error">Sin música disponible para esta consulta</span>
              )}
            </div>
            {musicStatus === 'ready' && musicUrl && (
              <audio ref={audioRef} controls loop className="audio-player" crossOrigin="anonymous">
                <source src={musicUrl} type="audio/mpeg" />
              </audio>
            )}
          </div>
        )}

        <div className="dashboard-grid">
          <section className="console">
            <div className="panel-header">MONITOR DE PROCESOS</div>
            <pre>{log || 'Esperando órdenes...'}</pre>
          </section>

          <section className="results">
            <div className="tabs">
              {['thinking', 'ausencias', 'bifurcaciones', 'grounding', 'neutralizacion', 'grafo'].map(tab => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={() => setActiveTab(tab)}
                  disabled={tab === 'grafo' && !grafoUrl}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="content-viewer">
              {activeTab === 'grafo' ? (
                grafoUrl ? (
                  <KnowledgeGraph grafoUrl={grafoUrl} />
                ) : (
                  <pre style={{ color: '#666' }}>
                    El grafo de conocimiento se generará al completar el análisis de los 4 agentes.
                  </pre>
                )
              ) : (
                <>
                  {activeTab === 'thinking' && results.thinking && results.thinking !== 'Generando...' && (
                    <div className="thinking-audio-bar">
                      <button 
                        onClick={handleSpeakThinking} 
                        disabled={isThinkingAudioLoading}
                        className="speak-btn"
                      >
                        {isThinkingAudioLoading ? <><Loader className="spin" size={12} /> Procesando...</> : <>🔈 Escuchar Thinking</>}
                      </button>
                      {thinkingAudioError && <span className="error-text">{thinkingAudioError}</span>}
                      {thinkingAudioUrl && (
                        <audio ref={thinkingAudioRef} controls className="thinking-player" crossOrigin="anonymous">
                          <source src={thinkingAudioUrl} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  )}
                  <pre style={{ color: activeTab === 'thinking' ? '#81d4fa' : '#ccc' }}>
                    {results[activeTab] || 'No hay datos de análisis disponibles para esta fase.'}
                  </pre>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <style>{`
        :root { --bg: #0a0a0a; --panel: #141414; --border: #333; --text: #e0e0e0; --accent: #00ff41; --dim: #666; --music: #a78bfa; }
        body { margin: 0; font-family: 'Courier New', monospace; background: var(--bg); color: var(--text); overflow: hidden; }
        .app-container { display: flex; flex-direction: column; height: 100vh; padding: 20px; box-sizing: border-box; }
        header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 15px; margin-bottom: 16px; flex-shrink: 0; }
        main { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .logo { display: flex; align-items: center; gap: 12px; color: var(--accent); }
        .config-btn { background: #1a1a1a; color: var(--dim); border: 1px solid var(--border); padding: 4px 10px; font-size: 11px; }
        .config-btn:hover { background: #333; color: white; }
        .status-badge { font-size: 11px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 2px; display: flex; align-items: center; gap: 6px; color: var(--dim); }
        
        /* Audio Settings Panel */
        .audio-settings-panel { display: flex; gap: 20px; background: #111; border: 1px solid var(--music); border-radius: 4px; padding: 15px; margin-bottom: 15px; flex-shrink: 0; }
        .settings-section { flex: 1; display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
        .settings-section h4 { margin: 0 0 10px 0; color: var(--music); font-size: 11px; letter-spacing: 1px; }
        .settings-section.effects-section h4 { color: #60a5fa; }
        .settings-section label { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .settings-section select { background: #222; color: #eee; border: 1px solid #444; padding: 4px; font-family: inherit; font-size: 11px; width: 140px; }
        .slider-label { display: flex; width: 100%; align-items: center; justify-content: space-between; }
        .slider-label input[type=range] { flex: 1; margin: 0 10px; height: 4px; accent-color: var(--music); }
        .slider-label span { width: 30px; text-align: right; color: var(--dim); }

        .input-panel { display: flex; gap: 10px; margin-bottom: 14px; flex-shrink: 0; }
        input { flex: 1; background: var(--panel); border: 1px solid var(--border); color: var(--text); padding: 12px 15px; font-family: inherit; font-size: 15px; outline: none; }
        input:focus { border-color: var(--accent); }
        button { background: var(--accent); color: black; border: none; padding: 0 25px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: 0.2s; }
        button:disabled { background: var(--dim); cursor: not-allowed; }
        .mic-btn { background: #1a1a1a; color: var(--text); border: 1px solid var(--border); padding: 0 15px; }
        .mic-btn:hover:not(:disabled) { background: #333; }
        .mic-btn.recording { background: #f87171; color: white; border-color: #f87171; animation: pulse 1.5s infinite; }

        /* ── Music Bar ── */
        .music-bar {
          display: flex; align-items: center; gap: 12px;
          background: #0d0d1a; border: 1px solid #2d2547;
          padding: 8px 14px; margin-bottom: 14px; flex-shrink: 0;
          border-radius: 2px;
        }
        .music-icon-area { color: var(--music); display: flex; align-items: center; flex-shrink: 0; }
        .music-info { flex: 1; min-width: 0; }
        .music-label { font-size: 12px; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .music-label.generating { color: var(--music); animation: pulse 1.5s ease-in-out infinite; }
        .music-label.ready { color: #c4b5fd; }
        .music-label.error { color: #f87171; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .audio-player { height: 28px; width: 240px; flex-shrink: 0; filter: invert(0.85) hue-rotate(200deg); }

        .dashboard-grid { display: grid; grid-template-columns: 350px 1fr; gap: 20px; flex: 1; min-height: 0; overflow: hidden; }
        .console, .results { background: var(--panel); border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; height: 100%; }
        .panel-header { padding: 8px 12px; background: #1a1a1a; font-size: 11px; border-bottom: 1px solid var(--border); color: var(--dim); letter-spacing: 1px; }
        .content-viewer { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        pre { padding: 20px; margin: 0; overflow-y: auto; font-size: 14px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; color: #a5d6a7; flex: 1; }

        pre::-webkit-scrollbar { width: 6px; }
        pre::-webkit-scrollbar-track { background: transparent; }
        pre::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        pre::-webkit-scrollbar-thumb:hover { background: var(--accent); }

        .tabs { display: flex; border-bottom: 1px solid var(--border); background: #0d0d0d; flex-shrink: 0; }
        .tabs button { flex: 1; background: transparent; color: var(--dim); border: none; border-right: 1px solid var(--border); padding: 12px; font-size: 10px; font-weight: bold; cursor: pointer; }
        .tabs button.active { color: var(--accent); background: var(--panel); }
        .content-viewer pre { color: #ccc; flex: 1; }
        .thinking-audio-bar { display: flex; align-items: center; gap: 15px; padding: 10px 20px; background: #0d0d0d; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .speak-btn { background: #1f2937; color: #e5e7eb; border: 1px solid #374151; padding: 6px 12px; font-size: 11px; border-radius: 4px; }
        .speak-btn:hover:not(:disabled) { background: #374151; }
        .error-text { color: #f87171; font-size: 11px; }
        .thinking-player { height: 25px; filter: invert(0.85) hue-rotate(200deg); }
        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
