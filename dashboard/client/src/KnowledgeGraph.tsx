import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Entidad {
  id: string;
  agente: string;
  tipo: string;
  label: string;
  fragmento?: string;
  descripcion?: string;
  certeza: 'alta' | 'media' | 'baja';
  descarte?: string;
  omitido?: string;
  reemplazado_por?: string;
  pregunta_clausurada?: string;
  comunidad?: number;
}

interface Relacion {
  desde: string;
  hacia: string;
  tipo: string;
  certeza: 'alta' | 'media' | 'baja';
}

interface GrafoData {
  metadata: {
    timestamp: string;
    modelo: string;
    provider: string;
    comunidades_detectadas?: number;
  };
  entidades: Entidad[];
  relaciones: Relacion[];
}

interface KnowledgeGraphProps {
  grafoUrl: string;
}

const KnowledgeGraph = ({ grafoUrl }: KnowledgeGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Entidad | null>(null);
  const [grafoData, setGrafoData] = useState<GrafoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<'agente' | 'comunidad'>('agente');

  // Colores por agente
  const colorMap: Record<string, string> = {
    bifurcaciones: '#f59e0b',
    grounding: '#10b981',
    neutralizacion: '#ef4444',
    ausencias: '#8b5cf6',
    sistema: '#3b82f6'
  };

  // Escala de colores para comunidades (D3)
  const communityColorScale = d3.scaleOrdinal(d3.schemeCategory10);

  useEffect(() => {
    const fetchGrafo = async () => {
      try {
        const res = await fetch(grafoUrl);
        if (!res.ok) throw new Error('No se pudo cargar el grafo');
        const data: GrafoData = await res.json();
        setGrafoData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchGrafo();
  }, [grafoUrl]);

  useEffect(() => {
    if (!grafoData || !svgRef.current) return;

    const { entidades, relaciones } = grafoData;
    if (entidades.length === 0) return;

    // Limpiar SVG
    d3.select(svgRef.current).selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Crear contenedor con zoom
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Preparar datos para D3
    let nodes = entidades.map(e => ({ ...e }));
    
    // Verificar si hay relaciones hacia 'respuesta_final' y crear el nodo si no existe
    const hasRespuestaFinal = relaciones.some(r => r.hacia === 'respuesta_final' || r.desde === 'respuesta_final');
    if (hasRespuestaFinal && !nodes.find(n => n.id === 'respuesta_final')) {
      nodes.push({
        id: 'respuesta_final',
        agente: 'sistema',
        tipo: 'resultado_llm',
        label: 'Respuesta Final (Pública)',
        descripcion: 'El resultado final que el LLM entregó al usuario tras su proceso de pensamiento.',
        certeza: 'alta'
      });
    }

    // Filtrar relaciones que apuntan a nodos inexistentes (defensa contra errores de D3)
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = relaciones
      .filter(r => nodeIds.has(r.desde) && nodeIds.has(r.hacia))
      .map(r => ({
        source: r.desde,
        target: r.hacia,
        tipo: r.tipo,
        certeza: r.certeza
      }));

    // Simulación de fuerzas
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Dibujar aristas
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#444')
      .attr('stroke-width', (d: any) => d.certeza === 'alta' ? 2 : d.certeza === 'media' ? 1.5 : 1)
      .attr('stroke-dasharray', (d: any) => d.certeza === 'baja' ? '5,5' : '0')
      .attr('opacity', 0.6);

    // Dibujar nodos
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => d.certeza === 'alta' ? 12 : d.certeza === 'media' ? 10 : 8)
      .attr('fill', (d: any) => {
        if (colorMode === 'agente') {
          return colorMap[d.agente] || '#666';
        } else {
          return d.comunidad !== undefined ? communityColorScale(d.comunidad.toString()) : '#666';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Etiquetas
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: any) => d.label.length > 25 ? d.label.slice(0, 25) + '...' : d.label)
      .attr('font-size', 10)
      .attr('fill', '#ccc')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .style('pointer-events', 'none');

    // Actualizar posiciones en cada tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Click en el fondo para deseleccionar
    svg.on('click', () => setSelectedNode(null));

  }, [grafoData, colorMode]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#f87171' }}>
        Error al cargar el grafo: {error}
      </div>
    );
  }

  if (!grafoData) {
    return (
      <div style={{ padding: '20px', color: '#666' }}>
        Cargando grafo de conocimiento...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ flex: 1, background: '#0a0a0a' }} />
      
      {selectedNode && (
        <div className="node-detail-panel">
          <div className="detail-header" style={{ borderLeftColor: colorMap[selectedNode.agente] }}>
            <span className="detail-agente">{selectedNode.agente.toUpperCase()}</span>
            <span className="detail-tipo">{selectedNode.tipo}</span>
            <button 
              className="close-btn"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="detail-content">
            <div className="detail-field">
              <strong>Label:</strong>
              <p>{selectedNode.label}</p>
            </div>

            {selectedNode.comunidad !== undefined && (
              <div className="detail-field">
                <strong>Clúster Louvain:</strong>
                <p>Comunidad #{selectedNode.comunidad}</p>
              </div>
            )}

            {selectedNode.fragmento && (
              <div className="detail-field">
                <strong>Fragmento del Thinking:</strong>
                <p className="fragmento">{selectedNode.fragmento}</p>
              </div>
            )}

            {selectedNode.descripcion && (
              <div className="detail-field">
                <strong>Descripción:</strong>
                <p>{selectedNode.descripcion}</p>
              </div>
            )}

            {selectedNode.descarte && (
              <div className="detail-field">
                <strong>Tipo de descarte:</strong>
                <p>{selectedNode.descarte}</p>
              </div>
            )}

            {selectedNode.omitido && (
              <div className="detail-field">
                <strong>Omitido:</strong>
                <p>{selectedNode.omitido}</p>
              </div>
            )}

            {selectedNode.reemplazado_por && (
              <div className="detail-field">
                <strong>Reemplazado por:</strong>
                <p>{selectedNode.reemplazado_por}</p>
              </div>
            )}

            {selectedNode.pregunta_clausurada && (
              <div className="detail-field">
                <strong>Pregunta clausurada:</strong>
                <p>{selectedNode.pregunta_clausurada}</p>
              </div>
            )}

            <div className="detail-field">
              <strong>Certeza:</strong>
              <span className={`certeza-badge certeza-${selectedNode.certeza}`}>
                {selectedNode.certeza}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="graph-controls">
        <div className="control-title">MODO DE COLOR</div>
        <div className="toggle-container">
          <button 
            className={`toggle-btn ${colorMode === 'agente' ? 'active' : ''}`}
            onClick={() => setColorMode('agente')}
          >
            Agente
          </button>
          <button 
            className={`toggle-btn ${colorMode === 'comunidad' ? 'active' : ''}`}
            onClick={() => setColorMode('comunidad')}
          >
            Comunidad (Louvain)
          </button>
        </div>
      </div>

      <div className="graph-legend">
        {colorMode === 'agente' ? (
          <>
            <div className="legend-title">AGENTES</div>
            {Object.entries(colorMap).map(([agente, color]) => (
              <div key={agente} className="legend-item">
                <div className="legend-color" style={{ background: color }} />
                <span>{agente}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="legend-title">COMUNIDADES</div>
            <div className="legend-info">
              {grafoData.metadata.comunidades_detectadas || '...'} grupos detectados
            </div>
            <p style={{ fontSize: '9px', color: '#666', marginTop: '5px' }}>
              Los nodos del mismo color forman un clúster de sesgo detectado por Louvain.
            </p>
          </>
        )}
        
        <div className="legend-title" style={{ marginTop: '15px' }}>CERTEZA</div>
        <div className="legend-item">
          <div className="legend-line" style={{ borderStyle: 'solid' }} />
          <span>Alta</span>
        </div>
        <div className="legend-item">
          <div className="legend-line" style={{ borderStyle: 'solid', borderWidth: '1px' }} />
          <span>Media</span>
        </div>
        <div className="legend-item">
          <div className="legend-line" style={{ borderStyle: 'dashed' }} />
          <span>Baja</span>
        </div>
      </div>

      <style>{`
        .graph-controls {
          position: absolute;
          left: 20px;
          bottom: 20px;
          background: #141414;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 12px;
          z-index: 10;
        }

        .control-title {
          font-weight: bold;
          font-size: 10px;
          color: #999;
          margin-bottom: 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .toggle-container {
          display: flex;
          gap: 5px;
        }

        .toggle-btn {
          background: #222;
          border: 1px solid #444;
          color: #888;
          padding: 5px 10px;
          font-size: 10px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          background: #333;
          color: #fff;
        }

        .toggle-btn.active {
          background: #00ff41;
          color: #000;
          border-color: #00ff41;
          font-weight: bold;
        }

        .legend-info {
          font-size: 12px;
          color: #00ff41;
          margin-bottom: 5px;
        }

        .node-detail-panel {
          position: absolute;
          right: 20px;
          top: 20px;
          width: 320px;
          max-height: calc(100% - 40px);
          background: #141414;
          border: 1px solid #333;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          z-index: 10;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          background: #1a1a1a;
          border-left: 4px solid;
          border-bottom: 1px solid #333;
        }

        .detail-agente {
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
          color: #00ff41;
        }

        .detail-tipo {
          font-size: 10px;
          color: #999;
          flex: 1;
        }

        .close-btn {
          background: transparent;
          color: #666;
          border: none;
          padding: 0;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 16px;
        }

        .close-btn:hover {
          color: #fff;
        }

        .detail-content {
          padding: 15px;
          overflow-y: auto;
          flex: 1;
        }

        .detail-field {
          margin-bottom: 15px;
        }

        .detail-field strong {
          display: block;
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .detail-field p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #e0e0e0;
        }

        .detail-field p.fragmento {
          font-style: italic;
          color: #81d4fa;
          background: #0d1117;
          padding: 8px;
          border-radius: 2px;
          border-left: 2px solid #81d4fa;
        }

        .certeza-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .certeza-alta {
          background: #10b981;
          color: #000;
        }

        .certeza-media {
          background: #f59e0b;
          color: #000;
        }

        .certeza-baja {
          background: #666;
          color: #fff;
        }

        .graph-legend {
          position: absolute;
          left: 20px;
          top: 20px;
          background: #141414;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 12px;
          font-size: 11px;
          z-index: 10;
        }

        .legend-title {
          font-weight: bold;
          color: #00ff41;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: #ccc;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #fff;
        }

        .legend-line {
          width: 20px;
          height: 0;
          border-top: 2px solid #444;
        }
      `}</style>
    </div>
  );
};

export default KnowledgeGraph;
