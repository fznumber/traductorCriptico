const fs = require('fs');
const path = require('path');

const ROOT_PATH = __dirname;
const WORKSPACES_DIR = path.join(ROOT_PATH, 'workspaces');
const OUTPUT_FILE = path.join(ROOT_PATH, 'grafo.json');

const WORKSPACES = ['ausencias', 'bifurcaciones', 'grounding', 'neutralizacion'];

function consolidar() {
    console.log('>> Iniciando consolidación robusta del grafo...');
    
    const grafoConsolidado = {
        metadata: {
            timestamp: new Date().toISOString(),
            modelo: "consolidado-local",
            version: "2.0"
        },
        entidades: [],
        relaciones: []
    };

    WORKSPACES.forEach(workspace => {
        const filePath = path.join(WORKSPACES_DIR, workspace, 'RESULTADO_FASE1.md');
        
        if (!fs.existsSync(filePath)) {
            console.log(`   [!] No se encontró resultado para: ${workspace}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Expresión regular para extraer el bloque json-grafo
        const regex = /```json-grafo([\s\S]*?)```/;
        const match = content.match(regex);

        if (match && match[1]) {
            try {
                const jsonStr = match[1].trim();
                const data = JSON.parse(jsonStr);
                
                if (data.entidades && Array.isArray(data.entidades)) {
                    grafoConsolidado.entidades.push(...data.entidades);
                }
                
                if (data.relaciones && Array.isArray(data.relaciones)) {
                    grafoConsolidado.relaciones.push(...data.relaciones);
                }
                
                console.log(`   [OK] Datos extraídos de ${workspace} (${data.entidades?.length || 0} nodos)`);
            } catch (e) {
                console.error(`   [!] Error parseando JSON de ${workspace}: ${e.message}`);
            }
        } else {
            console.log(`   [!] No se encontró bloque json-grafo en ${workspace}`);
        }
    });

    // Escribir el resultado final
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(grafoConsolidado, null, 2));
    console.log(`\n>> ÉXITO: Grafo consolidado en ${OUTPUT_FILE}`);
    console.log(`   Total nodos: ${grafoConsolidado.entidades.length}`);
    console.log(`   Total relaciones: ${grafoConsolidado.relaciones.length}`);
}

consolidar();
