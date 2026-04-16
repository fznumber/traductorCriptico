#!/usr/bin/env node

/**
 * Script de Limpieza: Eliminar todas las sesiones y datos relacionados
 * 
 * Este script elimina:
 * - Todas las sesiones
 * - Todos los logs de agentes
 * - Todas las configuraciones de audio
 * - Todos los estados de UI
 * - Todas las definiciones personalizadas de agentes
 * - Todos los logs de actividad
 * 
 * Mantiene:
 * - Usuarios (Diego, Claudia, Ariel, Invitado)
 * - Definiciones por defecto de agentes
 */

const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');

const dbPath = path.resolve(__dirname, 'tc2026.db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  ADVERTENCIA: Este script eliminará TODAS las sesiones y datos relacionados');
console.log('');
console.log('Se eliminarán:');
console.log('  - Todas las sesiones');
console.log('  - Todos los logs de agentes');
console.log('  - Todas las configuraciones de audio');
console.log('  - Todos los estados de UI');
console.log('  - Todas las definiciones personalizadas de agentes');
console.log('  - Todos los logs de actividad');
console.log('');
console.log('Se mantendrán:');
console.log('  - Usuarios (Diego, Claudia, Ariel, Invitado)');
console.log('  - Definiciones por defecto de agentes');
console.log('');

rl.question('¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar): ', (answer) => {
    if (answer.toUpperCase() !== 'SI') {
        console.log('❌ Operación cancelada');
        rl.close();
        process.exit(0);
    }

    console.log('');
    console.log('🔧 Iniciando limpieza...');
    
    try {
        const db = new Database(dbPath);
        
        // Contar registros antes
        const countSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
        const countAgentLogs = db.prepare('SELECT COUNT(*) as count FROM agent_logs').get();
        const countAudioConfig = db.prepare('SELECT COUNT(*) as count FROM audio_config').get();
        const countUiState = db.prepare('SELECT COUNT(*) as count FROM ui_state').get();
        const countAgentDefs = db.prepare('SELECT COUNT(*) as count FROM agent_definitions').get();
        const countActivityLogs = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get();
        
        console.log('');
        console.log('📊 Registros a eliminar:');
        console.log(`  - Sesiones: ${countSessions.count}`);
        console.log(`  - Logs de agentes: ${countAgentLogs.count}`);
        console.log(`  - Configuraciones de audio: ${countAudioConfig.count}`);
        console.log(`  - Estados de UI: ${countUiState.count}`);
        console.log(`  - Definiciones de agentes: ${countAgentDefs.count}`);
        console.log(`  - Logs de actividad: ${countActivityLogs.count}`);
        console.log('');
        
        // Eliminar en orden (las FK con CASCADE se encargarán de la mayoría)
        console.log('🗑️  Eliminando logs de actividad...');
        db.prepare('DELETE FROM activity_logs').run();
        
        console.log('🗑️  Eliminando definiciones personalizadas de agentes...');
        db.prepare('DELETE FROM agent_definitions').run();
        
        console.log('🗑️  Eliminando estados de UI...');
        db.prepare('DELETE FROM ui_state').run();
        
        console.log('🗑️  Eliminando configuraciones de audio...');
        db.prepare('DELETE FROM audio_config').run();
        
        console.log('🗑️  Eliminando logs de agentes...');
        db.prepare('DELETE FROM agent_logs').run();
        
        console.log('🗑️  Eliminando sesiones...');
        db.prepare('DELETE FROM sessions').run();
        
        // Resetear autoincrement
        console.log('🔄 Reseteando contadores de autoincrement...');
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('sessions', 'agent_logs', 'audio_config', 'ui_state', 'agent_definitions', 'activity_logs')").run();
        
        // Verificar que se eliminó todo
        const finalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
        const finalAgentLogs = db.prepare('SELECT COUNT(*) as count FROM agent_logs').get();
        const finalAudioConfig = db.prepare('SELECT COUNT(*) as count FROM audio_config').get();
        const finalUiState = db.prepare('SELECT COUNT(*) as count FROM ui_state').get();
        const finalAgentDefs = db.prepare('SELECT COUNT(*) as count FROM agent_definitions').get();
        const finalActivityLogs = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get();
        
        console.log('');
        console.log('✅ Limpieza completada');
        console.log('');
        console.log('📊 Registros restantes:');
        console.log(`  - Sesiones: ${finalSessions.count}`);
        console.log(`  - Logs de agentes: ${finalAgentLogs.count}`);
        console.log(`  - Configuraciones de audio: ${finalAudioConfig.count}`);
        console.log(`  - Estados de UI: ${finalUiState.count}`);
        console.log(`  - Definiciones de agentes: ${finalAgentDefs.count}`);
        console.log(`  - Logs de actividad: ${finalActivityLogs.count}`);
        
        // Verificar usuarios
        const users = db.prepare('SELECT * FROM users').all();
        console.log('');
        console.log('👥 Usuarios mantenidos:');
        users.forEach(u => console.log(`  - ${u.username} (ID: ${u.id})`));
        
        // Verificar definiciones por defecto
        const defaultDefs = db.prepare('SELECT COUNT(*) as count FROM default_agent_definitions').get();
        console.log('');
        console.log(`📚 Definiciones por defecto mantenidas: ${defaultDefs.count}`);
        
        db.close();
        
        console.log('');
        console.log('🎉 Base de datos limpia y lista para usar');
        console.log('');
        console.log('Próximos pasos:');
        console.log('  1. Reinicia el servidor si está corriendo');
        console.log('  2. Haz logout en el frontend');
        console.log('  3. Haz login con tu usuario');
        console.log('  4. Crea una nueva sesión');
        
    } catch (error) {
        console.error('');
        console.error('❌ Error durante la limpieza:', error.message);
        process.exit(1);
    }
    
    rl.close();
});
