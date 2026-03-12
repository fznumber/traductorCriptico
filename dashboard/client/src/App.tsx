import React, { useState } from 'react';
import { Terminal, Play, Loader } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle'); 
  const [log, setLog] = useState('');
  const [results, setResults] = useState<any>({});
  const [activeTab, setActiveTab] = useState('thinking');

  const runPipeline = async () => {
    if (!prompt) return;
    setStatus('generating');
    setLog('>> Iniciando proceso crítico para: "' + prompt + '"\n');

    try {
      setLog(prev => prev + '>> Solicitando Thinking a Ollama (qwen3.5:4b)...\n');
      const genRes = await fetch(`${API_BASE}/generate-thinking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const genData = await genRes.json();
      
      if (genData.success) {
        setLog(prev => prev + '>> Thinking capturado en thinking.txt\n');
        setResults((prev: any) => ({ ...prev, thinking: genData.thinking }));
        setActiveTab('thinking');
        
        setStatus('processing');
        setLog(prev => prev + '>> Orquestando 4 agentes en OpenClaw...\n');
        
        const runRes = await fetch(`${API_BASE}/run-phase-1`, { method: 'POST' });
        const runData = await runRes.json();
        
        setLog(prev => prev + (runData.log || 'Fase 1 completada.') + '\n');
        
        const resRes = await fetch(`${API_BASE}/results`);
        const data = await resRes.json();
        setResults((prev: any) => ({ ...prev, ...data }));
        setStatus('completed');
      }
    } catch (err: any) {
      setLog(prev => prev + '!! Error: ' + err.message + '\n');
      setStatus('idle');
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <Terminal size={24} />
          <h1 style={{fontSize: '18px', margin: 0}}>TC2026 / TRADUCTOR CRÍTICO</h1>
        </div>
        <div className="status-badge">
          {status === 'processing' && <Loader className="spin" size={14} />}
          {status.toUpperCase()}
        </div>
      </header>

      <main>
        <div className="input-panel">
          <input 
            type="text" 
            placeholder="Introduce enunciado normativo (ej. 'El Estado garantiza seguridad')..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={status === 'generating' || status === 'processing'}
          />
          <button onClick={runPipeline} disabled={status === 'generating' || status === 'processing'}>
            <Play size={16} /> ANALIZAR
          </button>
        </div>

        <div className="dashboard-grid">
          <section className="console">
            <div className="panel-header">MONITOR DE PROCESOS</div>
            <pre>{log || 'Esperando órdenes...'}</pre>
          </section>

          <section className="results">
            <div className="tabs">
              {['thinking', 'ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'].map(tab => (
                <button 
                  key={tab} 
                  className={activeTab === tab ? 'active' : ''} 
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="content-viewer">
              <pre style={{ color: activeTab === 'thinking' ? '#81d4fa' : '#ccc' }}>
                {results[activeTab] || 'No hay datos de análisis disponibles para esta fase.'}
              </pre>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        :root { --bg: #0a0a0a; --panel: #141414; --border: #333; --text: #e0e0e0; --accent: #00ff41; --dim: #666; }
        body { margin: 0; font-family: 'Courier New', monospace; background: var(--bg); color: var(--text); overflow: hidden; }
        .app-container { display: flex; flex-direction: column; height: 100vh; padding: 20px; box-sizing: border-box; }
        header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; }
        .logo { display: flex; align-items: center; gap: 12px; color: var(--accent); }
        .status-badge { font-size: 11px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 2px; display: flex; align-items: center; gap: 6px; color: var(--dim); }
        .input-panel { display: flex; gap: 10px; margin-bottom: 20px; }
        input { flex: 1; background: var(--panel); border: 1px solid var(--border); color: var(--text); padding: 12px 15px; font-family: inherit; font-size: 15px; outline: none; }
        input:focus { border-color: var(--accent); }
        button { background: var(--accent); color: black; border: none; padding: 0 25px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; }
        button:disabled { background: var(--dim); cursor: not-allowed; }
        .dashboard-grid { display: grid; grid-template-columns: 350px 1fr; gap: 20px; flex: 1; min-height: 0; }
        .console, .results { background: var(--panel); border: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; height: 100%; }
        .panel-header { padding: 8px 12px; background: #1a1a1a; font-size: 11px; border-bottom: 1px solid var(--border); color: var(--dim); letter-spacing: 1px; }
        .content-viewer { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        pre { padding: 20px; margin: 0; overflow: auto; font-size: 14px; white-space: pre; line-height: 1.6; color: #a5d6a7; flex: 1; }
        
        /* Scrollbar estilizado (Vertical y Horizontal) */
        pre::-webkit-scrollbar { width: 6px; height: 6px; }
        pre::-webkit-scrollbar-track { background: transparent; }
        pre::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        pre::-webkit-scrollbar-thumb:hover { background: var(--accent); }

        .tabs { display: flex; border-bottom: 1px solid var(--border); background: #0d0d0d; flex-shrink: 0; }
        .tabs button { flex: 1; background: transparent; color: var(--dim); border: none; border-right: 1px solid var(--border); padding: 12px; font-size: 10px; font-weight: bold; cursor: pointer; }
        .tabs button.active { color: var(--accent); background: var(--panel); }
        .content-viewer pre { color: #ccc; }
        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
