const Graph = require('graphology');
const louvain = require('graphology-communities-louvain');

/**
 * Aplica el algoritmo de Louvain a los datos del grafo.
 * @param {Object} data - Objeto con { entidades, relaciones }
 * @returns {Object} - Datos actualizados con campo 'comunidad' en cada entidad
 */
function applyClustering(data) {
    if (!data.entidades || data.entidades.length === 0) return data;

    const graph = new Graph();

    // 1. Agregar nodos
    data.entidades.forEach(entidad => {
        graph.addNode(entidad.id, { label: entidad.label });
    });

    // 2. Manejar nodos implícitos (como respuesta_final si no está en entidades pero sí en relaciones)
    if (data.relaciones) {
        data.relaciones.forEach(rel => {
            if (!graph.hasNode(rel.desde)) {
                graph.addNode(rel.desde, { label: rel.desde, virtual: true });
            }
            if (!graph.hasNode(rel.hacia)) {
                graph.addNode(rel.hacia, { label: rel.hacia, virtual: true });
            }
            
            // Agregar arista (Louvain funciona mejor con grafos no dirigidos para comunidades)
            if (!graph.hasEdge(rel.desde, rel.hacia)) {
                graph.addEdge(rel.desde, rel.hacia);
            }
        });
    }

    // 3. Ejecutar Louvain
    // Retorna un objeto { nodeId: communityId }
    const communities = louvain(graph);

    // 4. Mapear de vuelta a las entidades
    const updatedEntidades = data.entidades.map(entidad => {
        return {
            ...entidad,
            comunidad: communities[entidad.id] !== undefined ? communities[entidad.id] : -1
        };
    });

    // 5. Si hay nodos virtuales que resultaron tener comunidad, podríamos querer incluirlos 
    // pero por ahora mantendremos la estructura original de entidades.
    
    return {
        ...data,
        entidades: updatedEntidades,
        metadata: {
            ...data.metadata,
            clustering: 'louvain',
            comunidades_detectadas: new Set(Object.values(communities)).size
        }
    };
}

module.exports = { applyClustering };
