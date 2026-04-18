import { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Loader, Music, Mic } from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';

const getApiBase = () => {
  return 'http://localhost:3001/api';
};

const API_BASE = getApiBase();

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Gestión de sesiones
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSessionPrompt, setCurrentSessionPrompt] = useState<string>('');
  const [showSessionPanel, setShowSessionPanel] = useState(false);

  // Gestión de configuración de agentes
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [agentDefinitions, setAgentDefinitions] = useState<Record<string, string>>({});
  const [defaultDefinitions, setDefaultDefinitions] = useState<Record<string, string>>({});
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editingDefinition, setEditingDefinition] = useState<string>('');

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState('');
  const [results, setResults] = useState<any>({});
  const [activeTab, setActiveTab] = useState('thinking');
  const [activeFase, setActiveFase] = useState<number | null>(null); // null, 1, 2, 3
  const [grafoUrl, setGrafoUrl] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicPrompt, setMusicPrompt] = useState<string | null>(null);
  const [musicStatus, setMusicStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Audio y Screen Settings State ---
  const [showSettings, setShowSettings] = useState(false);
  const [screens, setScreens] = useState<any[]>([]);
  const [phaseScreens, setPhaseScreens] = useState({
    ausencias: 'main',
    bifurcaciones: 'main',
    grounding: 'main',
    neutralizacion: 'main'
  });
  const popupsRef = useRef<Record<string, Window | null>>({});
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [musicDeviceId, setMusicDeviceId] = useState<string>('default');
  const [musicPan, setMusicPan] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);
  
  const [effectsDeviceId, setEffectsDeviceId] = useState<string>('default');
  const [effectsPan, setEffectsPan] = useState(0);
  const [effectsVolume, setEffectsVolume] = useState(1);
  
  const [musicInstructionTemplate, setMusicInstructionTemplate] = useState<string>('Cinematic dark ambient for: {prompt}');

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

  // --- Lógica de Usuario y Login ---
  useEffect(() => {
    const savedUser = localStorage.getItem('tc2026_user');
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(data => {
        setUsersList(data);
        if (savedUser) {
          handleLogin(savedUser);
        } else {
          setIsLoadingUser(false);
        }
      })
      .catch(() => setIsLoadingUser(false));
  }, []);

  const handleLogin = async (username: string) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('tc2026_user', username);
        await loadUserSessions(username);
        await loadDefaultDefinitions();
        if (data.session) {
          setCurrentSessionId(data.session.id);
          loadSessionData(data.session.id, username);
          loadAgentDefinitions(data.session.id);
        }
      }
    } catch (e) {
      console.error('Login error', e);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadUserSessions = async (username: string) => {
    console.log('[LOAD SESSIONS] Cargando sesiones para usuario:', username);
    console.log('[LOAD SESSIONS] Tipo de username:', typeof username);
    console.log('[LOAD SESSIONS] Username es undefined?', username === undefined);
    
    if (!username) {
      console.error('[LOAD SESSIONS] ⚠️ Username es undefined o vacío!');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        headers: { 'x-user-name': username }
      });
      const data = await res.json();
      console.log('[LOAD SESSIONS] Sesiones recibidas:', data);
      setSessions(data);
    } catch (e) {
      console.error('[LOAD SESSIONS] Error loading sessions', e);
    }
  };

  const loadSessionData = async (sessionId: number, username: string) => {
    addLog(`>> Cargando sesión ${sessionId}...`);
    try {
      const res = await fetch(`${API_BASE}/results?sessionId=${sessionId}`, {
        headers: { 'x-user-name': username }
      });
      const data = await res.json();
      setResults(data);
      
      // Establecer el prompt de la sesión actual
      if (data.input_prompt) {
        setCurrentSessionPrompt(data.input_prompt);
      }
      
      const uiRes = await fetch(`${API_BASE}/ui-state?sessionId=${sessionId}`, {
        headers: { 'x-user-name': username }
      });
      const uiData = await uiRes.json();
      if (uiData.layout_data) setPhaseScreens(uiData.layout_data);
      
      // Cargar configuración de audio
      const audioRes = await fetch(`${API_BASE}/audio-config?sessionId=${sessionId}`, {
        headers: { 'x-user-name': username }
      });
      const audioData = await audioRes.json();
      console.log('[LOAD SESSION] Audio config recibida:', audioData);
      
      if (audioData) {
        // Configuración de dispositivos y volumen
        setMusicDeviceId(audioData.music_device_id || 'default');
        setMusicPan(audioData.music_pan || 0);
        setMusicVolume(audioData.music_volume || 1);
        setEffectsDeviceId(audioData.effects_device_id || 'default');
        setEffectsPan(audioData.effects_pan || 0);
        setEffectsVolume(audioData.effects_volume || 1);
        setMusicInstructionTemplate(audioData.music_instruction_template || 'Cinematic dark ambient for: {prompt}');
        
        // Música generada para esta sesión
        if (audioData.music_url) {
          console.log('[LOAD SESSION] Cargando música:', audioData.music_url);
          setMusicUrl(audioData.music_url);
          setMusicPrompt(audioData.music_prompt || null);
          setMusicStatus('ready');
        } else {
          console.log('[LOAD SESSION] No hay música para esta sesión');
          setMusicUrl(null);
          setMusicPrompt(null);
          setMusicStatus('idle');
        }
      }
    } catch (e) {
      console.error('Error loading session', e);
    }
  };

  const createNewSession = async () => {
    if (!currentUser) return;
    try {
      const res = await authFetch(`${API_BASE}/sessions/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_prompt: 'Nueva sesión' })
      });
      const data = await res.json();
      setCurrentSessionId(data.sessionId);
      setResults({});
      setLog('');
      setStatus('idle');
      setMusicUrl(null);
      setMusicPrompt(null);
      setMusicStatus('idle');
      setThinkingAudioUrl(null);
      await loadUserSessions(currentUser.username);
      addLog(`>> Nueva sesión creada: ${data.sessionId}`);
    } catch (e) {
      console.error('Error creating session', e);
    }
  };

  const switchSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setResults({});
    setLog('');
    setStatus('idle');
    setMusicUrl(null);
    setMusicPrompt(null);
    setMusicStatus('idle');
    setThinkingAudioUrl(null);
    // Resetear configuración de audio a valores por defecto antes de cargar
    setMusicDeviceId('default');
    setMusicPan(0);
    setMusicVolume(1);
    setEffectsDeviceId('default');
    setEffectsPan(0);
    setEffectsVolume(1);
    await loadSessionData(sessionId, currentUser.username);
    await loadAgentDefinitions(sessionId);
    setShowSessionPanel(false);
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm('¿Eliminar esta sesión permanentemente?')) return;
    
    if (!currentUser || !currentUser.username) {
      console.error('[DELETE] ⚠️ currentUser no está definido!');
      alert('Error: Usuario no autenticado. Por favor, vuelve a iniciar sesión.');
      return;
    }
    
    console.log('[DELETE] Intentando eliminar sesión:', sessionId);
    console.log('[DELETE] Usuario actual:', currentUser);
    console.log('[DELETE] Username:', currentUser.username);
    console.log('[DELETE] Username en localStorage:', localStorage.getItem('tc2026_user'));
    
    try {
      const res = await authFetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
      
      console.log('[DELETE] Respuesta status:', res.status);
      console.log('[DELETE] Respuesta ok:', res.ok);
      
      const data = await res.json();
      console.log('[DELETE] Respuesta data:', data);
      
      if (!res.ok) {
        const errorMsg = data.message || data.error || 'Error desconocido';
        console.error('[DELETE] Error al eliminar sesión:', errorMsg);
        addLog(`>> ❌ Error: ${errorMsg}`);
        alert(`No se pudo eliminar la sesión:\n${errorMsg}\n\nVerifica que estés logueado como el usuario correcto.`);
        return;
      }
      
      // Recargar lista de sesiones
      console.log('[DELETE] Recargando sesiones para:', currentUser.username);
      await loadUserSessions(currentUser.username);
      
      // Si eliminamos la sesión actual, cambiar a otra
      if (currentSessionId === sessionId) {
        console.log('[DELETE] Sesión eliminada era la actual, buscando otra...');
        // Obtener sesiones actualizadas del servidor
        const sessionsRes = await fetch(`${API_BASE}/sessions`, {
          headers: { 'x-user-name': currentUser.username }
        });
        const updatedSessions = await sessionsRes.json();
        console.log('[DELETE] Sesiones actualizadas:', updatedSessions);
        
        if (updatedSessions.length > 0) {
          // Cambiar a la primera sesión disponible
          console.log('[DELETE] Cambiando a sesión:', updatedSessions[0].id);
          switchSession(updatedSessions[0].id);
        } else {
          // No hay más sesiones, crear una nueva
          console.log('[DELETE] No hay más sesiones, creando nueva...');
          createNewSession();
        }
      }
      addLog(`>> ✅ Sesión ${sessionId} eliminada`);
    } catch (e: any) {
      console.error('[DELETE] Exception:', e);
      addLog(`>> ❌ Error al eliminar sesión: ${e.message}`);
      alert(`Error al eliminar sesión:\n${e.message}`);
    }
  };

  const saveAudioConfig = async () => {
    if (!currentSessionId) return;
    try {
      await authFetch(`${API_BASE}/audio-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          music_device_id: musicDeviceId,
          music_pan: musicPan,
          music_volume: musicVolume,
          effects_device_id: effectsDeviceId,
          effects_pan: effectsPan,
          effects_volume: effectsVolume,
          music_instruction_template: musicInstructionTemplate
        })
      });
    } catch (e) {
      console.error('Error saving audio config', e);
    }
  };

  // --- Funciones de Configuración de Agentes ---
  const loadAgentDefinitions = async (sessionId: number) => {
    try {
      const res = await authFetch(`${API_BASE}/agent-definitions/${sessionId}`);
      const data = await res.json();
      setAgentDefinitions(data);
    } catch (e) {
      console.error('Error loading agent definitions', e);
    }
  };

  const loadDefaultDefinitions = async () => {
    try {
      const res = await fetch(`${API_BASE}/default-agent-definitions`);
      const data = await res.json();
      setDefaultDefinitions(data);
    } catch (e) {
      console.error('Error loading default definitions', e);
    }
  };

  const openAgentEditor = (agentName: string) => {
    setEditingAgent(agentName);
    setEditingDefinition(agentDefinitions[agentName] || '');
  };

  const saveAgentDefinition = async () => {
    if (!editingAgent || !currentSessionId) return;
    try {
      await authFetch(`${API_BASE}/agent-definitions/${currentSessionId}/${editingAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: editingDefinition })
      });
      await loadAgentDefinitions(currentSessionId);
      setEditingAgent(null);
      setEditingDefinition('');
      addLog(`>> Definición de ${editingAgent} actualizada`);
    } catch (e) {
      console.error('Error saving agent definition', e);
    }
  };

  const resetAgentDefinition = async (agentName: string) => {
    if (!currentSessionId) return;
    if (!confirm(`¿Resetear ${agentName} a su definición por defecto?`)) return;
    try {
      await authFetch(`${API_BASE}/agent-definitions/${currentSessionId}/${agentName}`, {
        method: 'DELETE'
      });
      await loadAgentDefinitions(currentSessionId);
      addLog(`>> Definición de ${agentName} reseteada a default`);
    } catch (e) {
      console.error('Error resetting agent definition', e);
    }
  };

  const isAgentCustomized = (agentName: string) => {
    return agentDefinitions[agentName] !== defaultDefinitions[agentName];
  };

  const authFetch = (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'x-user-name': currentUser?.username || localStorage.getItem('tc2026_user') || ''
    };
    
    // Solo procesar body si existe y no es DELETE
    let finalBody = options.body;
    if (options.body && options.method !== 'DELETE') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      if (currentSessionId && !body.sessionId) {
        body.sessionId = currentSessionId;
      }
      finalBody = JSON.stringify(body);
    }
    
    return fetch(url, { 
      ...options, 
      headers,
      body: finalBody
    });
  };

  // --- Screens Enumerate ---
  const fetchScreens = async () => {
    try {
      if ('getScreenDetails' in window) {
        const screenDetails = await (window as any).getScreenDetails();
        setScreens(screenDetails.screens);
      } else {
        console.warn('Window Management API no soportada en este navegador.');
      }
    } catch (err) {
      console.error('Error obteniendo pantallas:', err);
    }
  };

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

  // Broadcast results updates to external screens
  useEffect(() => {
    Object.keys(popupsRef.current).forEach(phase => {
      const win = popupsRef.current[phase];
      if (win && !win.closed) {
        const contentEl = win.document.getElementById('content');
        if (contentEl) {
          contentEl.textContent = results[phase] || 'Generando...';
        }
      } else {
        popupsRef.current[phase] = null;
      }
    });
  }, [results]);

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

      // Aplicar Sink (Dispositivo) en AudioContext si el navegador lo soporta
      if (deviceId !== 'default' && 'setSinkId' in ctxRef.current) {
        (ctxRef.current as any).setSinkId(deviceId).catch((e:any) => console.log('Ctx Sink Error', e));
      } else if (deviceId !== 'default' && 'setSinkId' in audioElement) {
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

  // Guardar configuración de audio cuando cambie
  useEffect(() => {
    if (currentSessionId) {
      const timeoutId = setTimeout(() => {
        saveAudioConfig();
      }, 500); // Debounce de 500ms
      return () => clearTimeout(timeoutId);
    }
  }, [musicDeviceId, musicPan, musicVolume, effectsDeviceId, effectsPan, effectsVolume, musicInstructionTemplate, currentSessionId]);

  const handleSpeakThinking = async () => {
    if (!results.thinking) return;
    setIsThinkingAudioLoading(true);
    setThinkingAudioError(null);
    setThinkingAudioUrl(null);
    try {
      const res = await authFetch(`${API_BASE}/speak-thinking`, {
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
              const res = await authFetch(`${API_BASE}/transcribe`, {
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

  // Reemplazar fetch por authFetch en las funciones principales
  const runPipeline = async () => {
    if (!prompt) return;

    setStatus('generating');
    setMusicUrl(null);
    setMusicPrompt(null);
    setMusicStatus('generating');
    setThinkingAudioUrl(null);
    setThinkingAudioError(null);
    setLog(`>> Iniciando proceso crítico para: "${prompt}"\n`);
    setResults({ thinking: 'Generando...' });
    setActiveTab('thinking');
    
    // Actualizar el prompt de la sesión actual
    setCurrentSessionPrompt(prompt);

    try {
      addLog('>> Solicitando Thinking (segundo plano)...');
      const genRes = await authFetch(`${API_BASE}/generate-thinking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          sessionId: currentSessionId // Enviar sessionId actual si existe
        })
      });
      const genData = await genRes.json();
      const currentSid = genData.sessionId;

      if (!currentSid) throw new Error("No se pudo crear la sesión");
      
      // Actualizar el sessionId actual y recargar lista de sesiones
      setCurrentSessionId(currentSid);
      if (currentUser) {
        loadUserSessions(currentUser.username);
      }

      addLog('>> 🎵 Componiendo música de fondo...');
      authFetch(`${API_BASE}/generate-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, sessionId: currentSid })
      }).then(res => res.json()).then(musicData => {
        if (musicData.success && musicData.audioUrl) {
          setMusicUrl(musicData.audioUrl);
          setMusicPrompt(musicData.musicPrompt);
          setMusicStatus('ready');
        }
      });

      // Polling del Thinking usando el SID específico
      const checkThinking = setInterval(async () => {
        const resRes = await authFetch(`${API_BASE}/results?sessionId=${currentSid}`);
        const data = await resRes.json();
        if (data.thinking && !data.thinking.includes('ESPERANDO')) {
          clearInterval(checkThinking);
          setResults((prev: any) => ({ ...prev, ...data }));
          startPhase1(currentSid);
        }
      }, 3000);

      const startPhase1 = async (sid: number) => {
        setStatus('processing');
        addLog('>> Orquestando agentes...');
        await authFetch(`${API_BASE}/run-phase-1`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid })
        });

        const pollInterval = setInterval(async () => {
          try {
            const resRes = await authFetch(`${API_BASE}/results?sessionId=${sid}`);
            const data = await resRes.json();
            setResults((prev: any) => ({ ...prev, ...data }));

            // Verificar solo los agentes de Fase 1
            const fase1Agents = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];
            const fase1Finished = fase1Agents.every(agent => 
              data[agent] && 
              !String(data[agent]).includes('ANALIZANDO') && 
              !String(data[agent]).includes('ESPERANDO')
            );

            if (fase1Finished) {
              clearInterval(pollInterval);
              setStatus('completed');
              addLog('>> ✅ Análisis Fase 1 finalizado.');
              addLog('>> 💡 Fase 2 disponible. Haz clic en "EJECUTAR FASE 2" para continuar.');
            }
          } catch (e) { console.error('Polling error', e); }
        }, 3000);
      };
    } catch (err: any) { setStatus('idle'); }
  };

  const runPhase2 = async () => {
    if (!currentSessionId) return;
    
    setStatus('processing-phase2');
    addLog('>> Iniciando Fase 2 - Estratos de Interferencia...');
    
    try {
      const res = await authFetch(`${API_BASE}/run-phase-2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        addLog(`>> ❌ Error: ${data.error}`);
        setStatus('completed');
        return;
      }
      
      addLog('>> Ejecutando agentes de Fase 2...');
      
      // Polling de resultados de Fase 2
      const pollInterval = setInterval(async () => {
        try {
          const resRes = await authFetch(`${API_BASE}/results?sessionId=${currentSessionId}`);
          const data = await resRes.json();
          setResults((prev: any) => ({ ...prev, ...data }));

          // Verificar si Fase 2 está completa
          const fase2Agents = ['rag_dirigido', 'procedencia_marcos', 'cambio_semantico', 'patrones_contrastivos'];
          
          // Log para debugging
          console.log('[FASE 2 POLLING] Estado de agentes:', fase2Agents.map(agent => ({
            agent,
            hasData: !!data[agent],
            value: data[agent]?.substring(0, 50) + '...',
            isAnalyzing: String(data[agent]).includes('ANALIZANDO'),
            isWaiting: String(data[agent]).includes('ESPERANDO')
          })));
          
          const fase2Complete = fase2Agents.every(agent => 
            data[agent] && 
            !String(data[agent]).includes('ANALIZANDO') && 
            !String(data[agent]).includes('ESPERANDO')
          );

          if (fase2Complete) {
            clearInterval(pollInterval);
            setStatus('completed-phase2');
            addLog('>> ✅ Análisis Fase 2 finalizado.');
          }
        } catch (e) { 
          console.error('Polling error', e); 
        }
      }, 3000);
      
    } catch (err: any) {
      addLog(`>> ❌ Error ejecutando Fase 2: ${err.message}`);
      setStatus('completed');
    }
  };

  const runPhase3 = async () => {
    if (!currentSessionId) return;
    
    setStatus('processing-phase3');
    addLog('>> Iniciando Fase 3 - Exposición de la Fragilidad...');
    
    try {
      const res = await authFetch(`${API_BASE}/run-phase-3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        addLog(`>> ❌ Error: ${data.error}`);
        setStatus('completed-phase2');
        return;
      }
      
      addLog('>> Ejecutando agentes de Fase 3...');
      
      // Polling de resultados de Fase 3
      const pollInterval = setInterval(async () => {
        try {
          const resRes = await authFetch(`${API_BASE}/results?sessionId=${currentSessionId}`);
          const data = await resRes.json();
          setResults((prev: any) => ({ ...prev, ...data }));

          // Verificar si Fase 3 está completa
          const fase3Agents = ['fuentes_activadas', 'opacidad_residual', 'sensibilidad_contextual', 'vigencia_provisional'];
          
          console.log('[FASE 3 POLLING] Estado de agentes:', fase3Agents.map(agent => ({
            agent,
            hasData: !!data[agent],
            value: data[agent]?.substring(0, 50) + '...',
            isAnalyzing: String(data[agent]).includes('ANALIZANDO'),
            isWaiting: String(data[agent]).includes('ESPERANDO')
          })));
          
          const fase3Complete = fase3Agents.every(agent => 
            data[agent] && 
            !String(data[agent]).includes('ANALIZANDO') && 
            !String(data[agent]).includes('ESPERANDO')
          );

          if (fase3Complete) {
            clearInterval(pollInterval);
            setStatus('completed-phase3');
            addLog('>> ✅ Análisis Fase 3 finalizado.');
            addLog('>> 🎉 Análisis completo de las 3 fases.');
          }
        } catch (e) { 
          console.error('Polling error', e); 
        }
      }, 3000);
      
    } catch (err: any) {
      addLog(`>> ❌ Error ejecutando Fase 3: ${err.message}`);
      setStatus('completed-phase2');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentSessionId(null);
    setSessions([]);
    localStorage.removeItem('tc2026_user');
    setResults({});
    setLog('');
    setStatus('idle');
  };

  if (isLoadingUser) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#00ff41', fontFamily: 'monospace' }}>
        <Loader className="spin" size={32} />
        <span style={{ marginLeft: '15px' }}>INICIALIZANDO SISTEMA...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="user-selection-overlay">
        <div className="scanlines"></div>
        <div className="user-selection-card">
          <div className="header-decoration">
            <div className="line"></div>
            <Terminal className="logo-icon" size={42} />
            <div className="line"></div>
          </div>
          <h2>SISTEMA DE TRADUCCIÓN CRÍTICA 2026</h2>
          <div className="status-line">ESTADO: ESPERANDO AUTORIZACIÓN DE OPERADOR...</div>
          
          <div className="user-grid">
            {usersList.map((user, index) => (
              <button key={user.id} className={`user-btn color-${index}`} onClick={() => handleLogin(user.username)}>
                <div className="user-avatar-container">
                  <div className="user-avatar">{user.username[0]}</div>
                  <div className="avatar-ring"></div>
                </div>
                <div className="user-info">
                  <span className="user-label">OPERADOR</span>
                  <span className="user-name">{user.username.toUpperCase()}</span>
                </div>
                <div className="btn-glow"></div>
              </button>
            ))}
          </div>
          
          <div className="footer-status">NIVEL DE ACCESO: RESTRINGIDO / PROTOCOLO TC-ALPHA</div>
        </div>
        <style>{`
          .user-selection-overlay { 
            height: 100vh; width: 100vw; 
            display: flex; align-items: center; justify-content: center; 
            background: #050505; 
            background-image: radial-gradient(circle at center, #1a1a2e 0%, #050505 100%);
            font-family: 'Courier New', monospace; 
            position: relative;
            overflow: hidden;
          }
          .scanlines {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                        linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
            z-index: 10;
          }
          .user-selection-card { 
            background: rgba(10, 10, 10, 0.9); 
            border: 1px solid #333; 
            padding: 60px 40px; 
            border-radius: 8px; 
            text-align: center; 
            max-width: 800px; width: 90%; 
            box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,255,65,0.05);
            position: relative;
            z-index: 5;
            backdrop-filter: blur(10px);
          }
          .header-decoration { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; justify-content: center; }
          .header-decoration .line { height: 1px; flex: 1; background: linear-gradient(to right, transparent, #333, transparent); }
          .logo-icon { color: #00ff41; filter: drop-shadow(0 0 10px rgba(0,255,65,0.5)); }
          
          h2 { color: #00ff41; font-size: 20px; letter-spacing: 4px; margin: 0 0 10px 0; font-weight: 900; }
          .status-line { color: #666; font-size: 10px; margin-bottom: 40px; letter-spacing: 2px; }
          
          .user-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 25px; margin-top: 20px; }
          
          .user-btn { 
            background: #0f0f0f; border: 1px solid #222; color: #aaa; 
            padding: 25px 15px; display: flex; flex-direction: column; align-items: center; 
            gap: 15px; cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            position: relative; overflow: hidden; border-radius: 4px;
          }
          
          .user-avatar-container { position: relative; width: 60px; height: 60px; }
          .user-avatar { 
            width: 100%; height: 100%; background: #111; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 24px; border: 1px solid #333; color: #fff;
            position: relative; z-index: 2;
          }
          .avatar-ring { 
            position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; 
            border: 1px solid transparent; border-radius: 50%; transition: 0.4s;
          }
          
          .user-info { display: flex; flex-direction: column; gap: 4px; z-index: 2; }
          .user-label { font-size: 8px; color: #555; letter-spacing: 1px; }
          .user-name { font-size: 14px; font-weight: bold; letter-spacing: 1px; }
          
          /* Colores específicos para cada operador */
          .user-btn.color-0:hover .avatar-ring { border-color: #00ff41; box-shadow: 0 0 15px rgba(0,255,65,0.4); }
          .user-btn.color-1:hover .avatar-ring { border-color: #60a5fa; box-shadow: 0 0 15px rgba(96,165,250,0.4); }
          .user-btn.color-2:hover .avatar-ring { border-color: #f472b6; box-shadow: 0 0 15px rgba(244,114,182,0.4); }
          .user-btn.color-3:hover .avatar-ring { border-color: #fbbf24; box-shadow: 0 0 15px rgba(251,191,36,0.4); }
          
          .user-btn:hover { border-color: #444; background: #151515; transform: scale(1.05); color: #fff; }
          .user-btn:hover .user-label { color: #888; }
          
          .btn-glow { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%);
            opacity: 0; transition: 0.4s; pointer-events: none;
          }
          .user-btn:hover .btn-glow { opacity: 1; }
          
          .footer-status { margin-top: 50px; font-size: 9px; color: #333; letter-spacing: 3px; }
        `}</style>
      </div>
    );
  }

  const isRunning = status === 'generating' || status === 'processing' || status === 'processing-phase2' || status === 'processing-phase3';

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <Terminal size={24} />
          <h1 style={{ fontSize: '18px', margin: 0 }}>TC2026 / {currentUser?.username?.toUpperCase() || 'OPERADOR'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            className="config-btn session-btn" 
            onClick={() => setShowSessionPanel(!showSessionPanel)}
            title="Gestionar sesiones"
          >
            📋 SESIONES {sessions.length > 0 && `(${sessions.length})`}
          </button>
          <button 
            className="config-btn agent-btn" 
            onClick={() => {
              if (!showAgentConfig && currentSessionId) {
                loadAgentDefinitions(currentSessionId);
              }
              setShowAgentConfig(!showAgentConfig);
            }}
            title="Configurar agentes"
            disabled={!currentSessionId}
          >
            🤖 AGENTES
          </button>
          <button className="config-btn" onClick={logout}>🚪 SALIR</button>
          <button 
            className="config-btn"
            onClick={() => {
              if (!showSettings) {
                fetchAudioDevices();
                fetchScreens();
              }
              setShowSettings(!showSettings);
            }}
          >
             ⚙️ Configuración
          </button>
          <div className="status-badge">
            {isRunning && <Loader className="spin" size={14} />}
            {status.toUpperCase()}
          </div>
        </div>
      </header>

      {/* CONSULTA ACTUAL DE LA SESIÓN */}
      {currentSessionId && currentSessionPrompt && (
        <div className="current-query-banner">
          <div className="query-label">CONSULTA ACTUAL</div>
          <div className="query-text">{currentSessionPrompt}</div>
          <div className="query-session-id">Sesión #{currentSessionId}</div>
        </div>
      )}

      {/* PANEL DE SESIONES */}
      {showSessionPanel && (
        <div className="session-panel">
          <div className="session-panel-header">
            <h3>Gestión de Sesiones</h3>
            <button className="new-session-btn" onClick={createNewSession}>
              ➕ Nueva Sesión
            </button>
          </div>
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="empty-sessions">No hay sesiones disponibles</div>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                >
                  <div className="session-info" onClick={() => switchSession(session.id)}>
                    <div className="session-id">Sesión #{session.id}</div>
                    <div className="session-prompt">
                      {session.input_prompt || 'Sin prompt'}
                    </div>
                    <div className="session-date">
                      {new Date(session.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {session.has_thinking ? (
                      <span className="session-badge complete">✓ Completa</span>
                    ) : (
                      <span className="session-badge incomplete">○ Incompleta</span>
                    )}
                  </div>
                  {currentSessionId === session.id ? (
                    <div className="session-in-use-badge" title="Sesión actualmente en uso">
                      ⚡ EN USO
                    </div>
                  ) : (
                    <button 
                      className="delete-session-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      title="Eliminar sesión"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PANEL DE CONFIGURACIÓN DE AGENTES */}
      {showAgentConfig && currentSessionId && (
        <div className="agent-config-panel">
          <div className="agent-config-header">
            <h3>Configuración de Agentes - Sesión #{currentSessionId}</h3>
            <button className="close-btn" onClick={() => setShowAgentConfig(false)}>✕</button>
          </div>
          <div className="agent-list">
            {/* FASE 1 */}
            <div className="agent-phase-section">
              <div className="phase-title">FASE 1 - Detección de Zonas de Opacidad</div>
              {['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].map(agentName => (
                <div key={agentName} className="agent-item">
                  <div className="agent-header">
                    <div className="agent-name">
                      {agentName.toUpperCase()}
                      {isAgentCustomized(agentName) && (
                        <span className="customized-badge" title="Personalizado para esta sesión">✎</span>
                      )}
                    </div>
                    <div className="agent-actions">
                      <button 
                        className="edit-agent-btn"
                        onClick={() => openAgentEditor(agentName)}
                        title="Editar definición"
                      >
                        ✏️ Editar
                      </button>
                      {isAgentCustomized(agentName) && (
                        <button 
                          className="reset-agent-btn"
                          onClick={() => resetAgentDefinition(agentName)}
                          title="Resetear a definición por defecto"
                        >
                          ↺ Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="agent-preview">
                    {(agentDefinitions[agentName] || '').substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>

            {/* FASE 2 */}
            <div className="agent-phase-section">
              <div className="phase-title">FASE 2 - Estratos de Interferencia</div>
              {['rag_dirigido', 'procedencia_marcos', 'cambio_semantico', 'patrones_contrastivos'].map(agentName => (
                <div key={agentName} className="agent-item">
                  <div className="agent-header">
                    <div className="agent-name">
                      {agentName === 'rag_dirigido' ? 'RAG DIRIGIDO' :
                       agentName === 'procedencia_marcos' ? 'PROCEDENCIA MARCOS' :
                       agentName === 'cambio_semantico' ? 'CAMBIO SEMÁNTICO' :
                       agentName === 'patrones_contrastivos' ? 'PATRONES CONTRASTIVOS' : agentName.toUpperCase()}
                      {isAgentCustomized(agentName) && (
                        <span className="customized-badge" title="Personalizado para esta sesión">✎</span>
                      )}
                    </div>
                    <div className="agent-actions">
                      <button 
                        className="edit-agent-btn"
                        onClick={() => openAgentEditor(agentName)}
                        title="Editar definición"
                      >
                        ✏️ Editar
                      </button>
                      {isAgentCustomized(agentName) && (
                        <button 
                          className="reset-agent-btn"
                          onClick={() => resetAgentDefinition(agentName)}
                          title="Resetear a definición por defecto"
                        >
                          ↺ Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="agent-preview">
                    {(agentDefinitions[agentName] || '').substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>

            {/* FASE 3 */}
            <div className="agent-phase-section">
              <div className="phase-title">FASE 3 - Exposición de la Fragilidad</div>
              {['fuentes_activadas', 'opacidad_residual', 'sensibilidad_contextual', 'vigencia_provisional'].map(agentName => (
                <div key={agentName} className="agent-item">
                  <div className="agent-header">
                    <div className="agent-name">
                      {agentName === 'fuentes_activadas' ? 'FUENTES ACTIVADAS' :
                       agentName === 'opacidad_residual' ? 'OPACIDAD RESIDUAL' :
                       agentName === 'sensibilidad_contextual' ? 'SENSIBILIDAD CONTEXTUAL' :
                       agentName === 'vigencia_provisional' ? 'VIGENCIA PROVISIONAL' : agentName.toUpperCase()}
                      {isAgentCustomized(agentName) && (
                        <span className="customized-badge" title="Personalizado para esta sesión">✎</span>
                      )}
                    </div>
                    <div className="agent-actions">
                      <button 
                        className="edit-agent-btn"
                        onClick={() => openAgentEditor(agentName)}
                        title="Editar definición"
                      >
                        ✏️ Editar
                      </button>
                      {isAgentCustomized(agentName) && (
                        <button 
                          className="reset-agent-btn"
                          onClick={() => resetAgentDefinition(agentName)}
                          title="Resetear a definición por defecto"
                        >
                          ↺ Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="agent-preview">
                    {(agentDefinitions[agentName] || '').substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE AGENTE */}
      {editingAgent && (
        <div className="modal-overlay" onClick={() => setEditingAgent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Editar Agente: {editingAgent.toUpperCase()}</h3>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Sesión #{currentSessionId} • IDENTITY.md
                </div>
              </div>
              <button className="close-btn" onClick={() => setEditingAgent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <textarea
                className="agent-editor"
                value={editingDefinition}
                onChange={(e) => setEditingDefinition(e.target.value)}
                placeholder="Definición del agente (IDENTITY.md)..."
                spellCheck={false}
              />
              <div className="modal-info">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span className="char-count">
                    {editingDefinition.length} caracteres • {editingDefinition.split('\n').length} líneas
                  </span>
                  {defaultDefinitions[editingAgent] && editingDefinition === defaultDefinitions[editingAgent] && (
                    <span className="default-indicator">📄 Usando definición por defecto</span>
                  )}
                  {defaultDefinitions[editingAgent] && editingDefinition !== defaultDefinitions[editingAgent] && (
                    <span className="modified-indicator">✎ Definición modificada</span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#555' }}>
                  Tip: Usa Markdown para formatear la definición
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="restore-btn" 
                onClick={() => {
                  if (defaultDefinitions[editingAgent]) {
                    if (editingDefinition !== defaultDefinitions[editingAgent]) {
                      if (confirm('¿Restaurar la definición original? Se perderán los cambios actuales.')) {
                        setEditingDefinition(defaultDefinitions[editingAgent]);
                      }
                    }
                  }
                }}
                disabled={!defaultDefinitions[editingAgent] || editingDefinition === defaultDefinitions[editingAgent]}
                title="Restaurar definición por defecto"
              >
                ↺ Restaurar Original
              </button>
              <div style={{ flex: 1 }}></div>
              <button className="cancel-btn" onClick={() => setEditingAgent(null)}>
                Cancelar
              </button>
              <button className="save-btn" onClick={saveAgentDefinition}>
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* PANEL DE CONFIGURACIÓN DE AUDIO Y PANTALLAS */}
        {showSettings && (
          <div className="audio-settings-panel" style={{ flexWrap: 'wrap' }}>
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
              <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#888' }}>Instrucción de Generación (usa {'{prompt}'} para el texto del usuario):</span>
                <textarea 
                  value={musicInstructionTemplate} 
                  onChange={e => setMusicInstructionTemplate(e.target.value)}
                  placeholder="Cinematic dark ambient for: {prompt}"
                  style={{ 
                    width: '100%', 
                    minHeight: '60px', 
                    background: '#0a0a0a', 
                    border: '1px solid #333', 
                    color: '#00ff41', 
                    padding: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    resize: 'vertical'
                  }}
                />
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
            
            <div className="settings-section screens-section" style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px', minWidth: '100%' }}>
              <h4 style={{ color: '#fca5a5' }}>Canales de Salida Visual (Pantallas)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].map(phase => (
                  <label key={phase} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{phase}</span>
                    <select 
                      value={(phaseScreens as any)[phase]} 
                      onChange={e => setPhaseScreens(prev => ({ ...prev, [phase]: e.target.value }))}
                      style={{ flex: 1, maxWidth: '280px' }}
                    >
                      <option value="main">Pestaña Principal (Default)</option>
                      {screens.map((s, i) => (
                        <option key={`screen-${s.left}-${s.top}`} value={`${s.left},${s.top}`}>
                          {s.label || `Pantalla Ext. ${i + 1}`} ({s.width}x{s.height})
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
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
          <button 
            onClick={runPhase2} 
            disabled={status !== 'completed' || isRecording || isTranscribing}
            style={{ 
              background: status === 'completed' ? '#7c3aed' : '#333',
              borderColor: status === 'completed' ? '#a78bfa' : '#555'
            }}
            title="Ejecutar Fase 2 - Estratos de Interferencia"
          >
            <Play size={16} /> FASE 2
          </button>
          <button 
            onClick={runPhase3} 
            disabled={status !== 'completed-phase2' || isRecording || isTranscribing}
            style={{ 
              background: status === 'completed-phase2' ? '#f59e0b' : '#333',
              borderColor: status === 'completed-phase2' ? '#fbbf24' : '#555'
            }}
            title="Ejecutar Fase 3 - Exposición de la Fragilidad"
          >
            <Play size={16} /> FASE 3
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
              {/* Pestaña THINKING */}
              <button
                className={activeTab === 'thinking' ? 'active' : ''}
                onClick={() => { setActiveTab('thinking'); setActiveFase(null); }}
              >
                THINKING
              </button>

              {/* Pestaña FASE 1 con dropdown */}
              <div className="tab-group">
                <button
                  className={activeFase === 1 ? 'active' : ''}
                  onClick={() => {
                    if (activeFase === 1) {
                      setActiveFase(null);
                    } else {
                      setActiveFase(1);
                      setActiveTab('ausencias');
                    }
                  }}
                >
                  FASE 1 {activeFase === 1 ? '▲' : '▼'}
                </button>
                {/* Mostrar agente activo de Fase 1 */}
                {['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].includes(activeTab) && (
                  <span className="active-agent-label">→ {activeTab.toUpperCase()}</span>
                )}
                {activeFase === 1 && (
                  <div className="tab-dropdown">
                    {['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].map(tab => (
                      <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => {
                          setActiveTab(tab);
                          setActiveFase(null); // Cerrar dropdown al seleccionar
                        }}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pestaña FASE 2 con dropdown */}
              <div className="tab-group">
                <button
                  className={activeFase === 2 ? 'active' : ''}
                  onClick={() => {
                    if (activeFase === 2) {
                      setActiveFase(null);
                    } else {
                      setActiveFase(2);
                      setActiveTab('rag_dirigido');
                    }
                  }}
                >
                  FASE 2 {activeFase === 2 ? '▲' : '▼'}
                </button>
                {/* Mostrar agente activo de Fase 2 */}
                {['rag_dirigido', 'procedencia_marcos', 'cambio_semantico', 'patrones_contrastivos'].includes(activeTab) && (
                  <span className="active-agent-label">
                    → {
                      activeTab === 'rag_dirigido' ? 'RAG DIRIGIDO' :
                      activeTab === 'procedencia_marcos' ? 'PROCEDENCIA' :
                      activeTab === 'cambio_semantico' ? 'SEMÁNTICA' :
                      activeTab === 'patrones_contrastivos' ? 'PATRONES' : ''
                    }
                  </span>
                )}
                {activeFase === 2 && (
                  <div className="tab-dropdown">
                    {[
                      { key: 'rag_dirigido', label: 'RAG DIRIGIDO' },
                      { key: 'procedencia_marcos', label: 'PROCEDENCIA' },
                      { key: 'cambio_semantico', label: 'SEMÁNTICA' },
                      { key: 'patrones_contrastivos', label: 'PATRONES' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={activeTab === tab.key ? 'active' : ''}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setActiveFase(null); // Cerrar dropdown al seleccionar
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pestaña FASE 3 con dropdown */}
              <div className="tab-group">
                <button
                  className={activeFase === 3 ? 'active' : ''}
                  onClick={() => {
                    if (activeFase === 3) {
                      setActiveFase(null);
                    } else {
                      setActiveFase(3);
                      setActiveTab('fuentes_activadas');
                    }
                  }}
                >
                  FASE 3 {activeFase === 3 ? '▲' : '▼'}
                </button>
                {/* Mostrar agente activo de Fase 3 */}
                {['fuentes_activadas', 'opacidad_residual', 'sensibilidad_contextual', 'vigencia_provisional'].includes(activeTab) && (
                  <span className="active-agent-label">
                    → {
                      activeTab === 'fuentes_activadas' ? 'FUENTES' :
                      activeTab === 'opacidad_residual' ? 'OPACIDAD' :
                      activeTab === 'sensibilidad_contextual' ? 'CONTEXTO' :
                      activeTab === 'vigencia_provisional' ? 'VIGENCIA' : ''
                    }
                  </span>
                )}
                {activeFase === 3 && (
                  <div className="tab-dropdown">
                    {[
                      { key: 'fuentes_activadas', label: 'FUENTES' },
                      { key: 'opacidad_residual', label: 'OPACIDAD' },
                      { key: 'sensibilidad_contextual', label: 'CONTEXTO' },
                      { key: 'vigencia_provisional', label: 'VIGENCIA' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={activeTab === tab.key ? 'active' : ''}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setActiveFase(null); // Cerrar dropdown al seleccionar
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="content-viewer">
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
        .session-btn { color: #60a5fa; border-color: #1e3a5f; }
        .session-btn:hover { background: #1e3a5f; color: #93c5fd; }
        .agent-btn { color: #a78bfa; border-color: #4c1d95; }
        .agent-btn:hover:not(:disabled) { background: #4c1d95; color: #c4b5fd; }
        .agent-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .status-badge { font-size: 11px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 2px; display: flex; align-items: center; gap: 6px; color: var(--dim); }
        
        /* Current Query Banner */
        .current-query-banner {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .query-label {
          font-size: 9px;
          color: #64748b;
          letter-spacing: 1.5px;
          font-weight: bold;
          white-space: nowrap;
          padding: 4px 8px;
          background: #1e293b;
          border-radius: 2px;
          border: 1px solid #334155;
        }
        .query-text {
          flex: 1;
          font-size: 13px;
          color: #e2e8f0;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .query-session-id {
          font-size: 10px;
          color: #60a5fa;
          font-weight: bold;
          white-space: nowrap;
          padding: 4px 10px;
          background: #1e3a5f;
          border-radius: 2px;
          border: 1px solid #3b82f6;
        }
        
        /* Session Panel */
        .session-panel { 
          background: #0d0d0d; border: 1px solid #60a5fa; border-radius: 4px; 
          margin-bottom: 15px; flex-shrink: 0; max-height: 400px; 
          display: flex; flex-direction: column; overflow: hidden;
        }
        .session-panel-header { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px 15px; border-bottom: 1px solid #1e3a5f; background: #0a0a0a;
        }
        .session-panel-header h3 { 
          margin: 0; font-size: 13px; color: #60a5fa; letter-spacing: 1px; 
        }
        .new-session-btn { 
          background: #1e3a5f; color: #93c5fd; border: 1px solid #60a5fa; 
          padding: 4px 10px; font-size: 10px; cursor: pointer; border-radius: 2px;
          font-family: inherit; font-weight: bold;
        }
        .new-session-btn:hover { background: #2563eb; color: white; }
        .session-list { 
          overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px;
        }
        .session-list::-webkit-scrollbar { width: 6px; }
        .session-list::-webkit-scrollbar-track { background: transparent; }
        .session-list::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .session-list::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
        .empty-sessions { 
          text-align: center; padding: 30px; color: var(--dim); font-size: 12px; 
        }
        .session-item { 
          display: flex; align-items: center; gap: 10px;
          background: #111; border: 1px solid #222; padding: 10px 12px; 
          border-radius: 3px; cursor: pointer; transition: all 0.2s;
        }
        .session-item:hover { border-color: #60a5fa; background: #151515; }
        .session-item.active { 
          border-color: #60a5fa; background: #1e3a5f; 
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.2);
        }
        .session-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .session-id { font-size: 11px; color: #60a5fa; font-weight: bold; }
        .session-prompt { 
          font-size: 12px; color: #ccc; white-space: nowrap; 
          overflow: hidden; text-overflow: ellipsis; max-width: 500px;
        }
        .session-date { font-size: 10px; color: var(--dim); }
        .session-badge { 
          font-size: 9px; padding: 2px 6px; border-radius: 2px; 
          align-self: flex-start; margin-top: 2px;
        }
        .session-badge.complete { background: #065f46; color: #6ee7b7; }
        .session-badge.incomplete { background: #422006; color: #fbbf24; }
        .session-in-use-badge {
          background: #1e3a8a; border: 1px solid #3b82f6; color: #93c5fd;
          padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 2px;
          letter-spacing: 0.5px; white-space: nowrap;
          display: flex; align-items: center; gap: 4px;
        }
        .delete-session-btn { 
          background: transparent; border: 1px solid #333; color: #666; 
          padding: 4px 8px; font-size: 12px; cursor: pointer; border-radius: 2px;
          transition: all 0.2s;
        }
        .delete-session-btn:hover { 
          background: #7f1d1d; border-color: #991b1b; color: #fca5a5; 
        }
        
        /* Agent Config Panel */
        .agent-config-panel {
          background: #0d0d0d; border: 1px solid #a78bfa; border-radius: 4px;
          margin-bottom: 15px; flex-shrink: 0; max-height: 70vh;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .agent-config-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 15px; border-bottom: 1px solid #4c1d95; background: #0a0a0a;
        }
        .agent-config-header h3 {
          margin: 0; font-size: 13px; color: #a78bfa; letter-spacing: 1px;
        }
        .close-btn {
          background: transparent; border: 1px solid #333; color: #666;
          padding: 2px 8px; font-size: 14px; cursor: pointer; border-radius: 2px;
          transition: all 0.2s;
        }
        .close-btn:hover { background: #333; color: #fff; }
        .agent-list {
          overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 15px;
        }
        .agent-list::-webkit-scrollbar { width: 6px; }
        .agent-list::-webkit-scrollbar-track { background: transparent; }
        .agent-list::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .agent-list::-webkit-scrollbar-thumb:hover { background: #a78bfa; }
        .agent-phase-section {
          display: flex; flex-direction: column; gap: 10px;
        }
        .phase-title {
          font-size: 11px; font-weight: bold; color: #a78bfa;
          letter-spacing: 1px; padding: 8px 12px;
          background: #1a1a2e; border-left: 3px solid #a78bfa;
          border-radius: 2px; margin-bottom: 5px;
        }
        .agent-item {
          background: #111; border: 1px solid #222; padding: 12px;
          border-radius: 3px; transition: all 0.2s;
        }
        .agent-item:hover { border-color: #a78bfa; }
        .agent-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        .agent-name {
          font-size: 13px; color: #a78bfa; font-weight: bold;
          display: flex; align-items: center; gap: 8px;
        }
        .customized-badge {
          background: #4c1d95; color: #c4b5fd; font-size: 10px;
          padding: 2px 6px; border-radius: 2px;
        }
        .agent-actions {
          display: flex; gap: 8px;
        }
        .edit-agent-btn, .reset-agent-btn {
          background: #1a1a1a; border: 1px solid #333; color: #999;
          padding: 4px 10px; font-size: 10px; cursor: pointer;
          border-radius: 2px; transition: all 0.2s; font-family: inherit;
        }
        .edit-agent-btn:hover {
          background: #4c1d95; border-color: #a78bfa; color: #c4b5fd;
        }
        .reset-agent-btn:hover {
          background: #7f1d1d; border-color: #991b1b; color: #fca5a5;
        }
        .agent-preview {
          font-size: 11px; color: #666; line-height: 1.4;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85); display: flex;
          align-items: center; justify-content: center; z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 20px;
        }
        .modal-content {
          background: #0a0a0a; border: 1px solid #a78bfa;
          border-radius: 4px; width: 95%; max-width: 1400px;
          height: 85vh; display: flex; flex-direction: column;
          box-shadow: 0 0 50px rgba(167, 139, 250, 0.3);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 20px; border-bottom: 1px solid #4c1d95;
          flex-shrink: 0;
        }
        .modal-header h3 {
          margin: 0; font-size: 15px; color: #a78bfa; letter-spacing: 1px;
        }
        .modal-body {
          padding: 0; flex: 1; overflow: hidden; display: flex;
          flex-direction: column; min-height: 0;
        }
        .agent-editor {
          flex: 1; background: #0d0d0d; border: none;
          border-bottom: 1px solid #333;
          color: #e0e0e0; padding: 20px; font-family: 'Courier New', monospace;
          font-size: 13px; line-height: 1.8; resize: none; outline: none;
          overflow-y: auto; min-height: 0;
        }
        .agent-editor:focus { background: #0f0f0f; }
        .agent-editor::-webkit-scrollbar { width: 10px; }
        .agent-editor::-webkit-scrollbar-track { background: #0a0a0a; }
        .agent-editor::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .agent-editor::-webkit-scrollbar-thumb:hover { background: #a78bfa; }
        .modal-info {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11px; color: #666; padding: 10px 20px;
          background: #0a0a0a; flex-shrink: 0;
        }
        .char-count { color: #999; }
        .default-indicator { color: #60a5fa; }
        .modified-indicator { color: #fbbf24; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 12px 20px; border-top: 1px solid #4c1d95;
          flex-shrink: 0;
        }
        .cancel-btn, .save-btn, .restore-btn {
          padding: 8px 20px; font-size: 12px; cursor: pointer;
          border-radius: 2px; font-family: inherit; font-weight: bold;
          transition: all 0.2s;
        }
        .cancel-btn {
          background: #1a1a1a; border: 1px solid #333; color: #999;
        }
        .cancel-btn:hover { background: #333; color: #fff; }
        .save-btn {
          background: #4c1d95; border: 1px solid #a78bfa; color: #c4b5fd;
        }
        .save-btn:hover { background: #5b21b6; color: #fff; }
        .restore-btn {
          background: #1a1a1a; border: 1px solid #fbbf24; color: #fbbf24;
        }
        .restore-btn:hover:not(:disabled) { background: #78350f; color: #fde047; }
        .restore-btn:disabled { 
          opacity: 0.3; cursor: not-allowed; border-color: #333; color: #666;
        }
        
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

        .tabs { display: flex; border-bottom: 1px solid var(--border); background: #0d0d0d; flex-shrink: 0; position: relative; }
        .tabs > button { flex: 1; background: transparent; color: var(--dim); border: none; border-right: 1px solid var(--border); padding: 12px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .tabs > button.active { color: var(--accent); background: var(--panel); }
        .tabs > button:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .tab-group { position: relative; flex: 1; }
        .tab-group > button { width: 100%; background: transparent; color: var(--dim); border: none; border-right: 1px solid var(--border); padding: 12px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .tab-group > button.active { color: var(--accent); background: var(--panel); }
        
        .active-agent-label {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          font-size: 9px;
          color: var(--accent);
          font-weight: bold;
          letter-spacing: 0.5px;
          background: rgba(0, 255, 65, 0.1);
          padding: 3px 8px;
          border-radius: 2px;
          border: 1px solid rgba(0, 255, 65, 0.3);
          pointer-events: none;
          white-space: nowrap;
          z-index: 50;
        }
        
        .tab-dropdown { 
          position: absolute; top: 100%; left: 0; right: 0; 
          background: #0a0a0a; border: 1px solid var(--border); border-top: none;
          display: flex; flex-direction: column; z-index: 100;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .tab-dropdown button { 
          background: transparent; color: var(--dim); border: none; 
          border-bottom: 1px solid var(--border); padding: 10px 12px; 
          font-size: 9px; font-weight: bold; cursor: pointer; 
          text-align: left; transition: all 0.2s;
        }
        .tab-dropdown button:last-child { border-bottom: none; }
        .tab-dropdown button:hover { background: #1a1a1a; color: #fff; }
        .tab-dropdown button.active { color: var(--accent); background: var(--panel); border-left: 2px solid var(--accent); }
        
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
