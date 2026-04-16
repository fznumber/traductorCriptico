#!/usr/bin/env node

/**
 * Script de Migración: Agregar columnas de configuración de audio
 * 
 * Este script agrega las nuevas columnas a la tabla audio_config
 * en bases de datos existentes sin perder datos.
 * 
 * Uso: node migrate_audio_config.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'tc2026.db');

console.log('🔧 Iniciando migración de audio_config...');
console.log(`📁 Base de datos: ${dbPath}`);

try {
    const db = new Database(dbPath);
    
    // Función helper para agregar columnas
    const addColumnIfNotExists = (table, column, type, defaultValue) => {
        try {
            const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${defaultValue}`;
            db.prepare(sql).run();
            console.log(`✓ Columna agregada: ${table}.${column}`);
            return true;
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log(`⊙ Columna ya existe: ${table}.${column}`);
                return false;
            }
            throw e;
        }
    };
    
    let changes = 0;
    
    // Agregar nuevas columnas
    if (addColumnIfNotExists('audio_config', 'music_device_id', 'TEXT', "'default'")) changes++;
    if (addColumnIfNotExists('audio_config', 'music_pan', 'REAL', '0')) changes++;
    if (addColumnIfNotExists('audio_config', 'music_volume', 'REAL', '1')) changes++;
    if (addColumnIfNotExists('audio_config', 'effects_device_id', 'TEXT', "'default'")) changes++;
    if (addColumnIfNotExists('audio_config', 'effects_pan', 'REAL', '0')) changes++;
    if (addColumnIfNotExists('audio_config', 'effects_volume', 'REAL', '1')) changes++;
    
    // Para updated_at usamos NULL como default y luego actualizamos
    try {
        db.prepare('ALTER TABLE audio_config ADD COLUMN updated_at DATETIME').run();
        db.prepare('UPDATE audio_config SET updated_at = created_at WHERE updated_at IS NULL').run();
        console.log('✓ Columna agregada: audio_config.updated_at');
        changes++;
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('⊙ Columna ya existe: audio_config.updated_at');
        } else {
            throw e;
        }
    }
    
    // Verificar estructura final
    const columns = db.prepare("PRAGMA table_info(audio_config)").all();
    console.log('\n📋 Estructura final de audio_config:');
    columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
    });
    
    // Contar registros
    const count = db.prepare('SELECT COUNT(*) as count FROM audio_config').get();
    console.log(`\n📊 Registros en audio_config: ${count.count}`);
    
    db.close();
    
    console.log(`\n✅ Migración completada: ${changes} columnas agregadas`);
    
} catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
}
