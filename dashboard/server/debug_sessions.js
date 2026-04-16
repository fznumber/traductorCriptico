#!/usr/bin/env node

/**
 * Script de Debug: Ver sesiones y sus propietarios
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'tc2026.db');
const db = new Database(dbPath);

console.log('📊 USUARIOS:');
console.log('─'.repeat(60));
const users = db.prepare('SELECT * FROM users').all();
users.forEach(u => {
    console.log(`ID: ${u.id} | Username: ${u.username}`);
});

console.log('\n📋 SESIONES:');
console.log('─'.repeat(60));
const sessions = db.prepare(`
    SELECT s.id, s.user_id, u.username, s.input_prompt, s.created_at
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
`).all();

sessions.forEach(s => {
    console.log(`Session #${s.id} | User ID: ${s.user_id} (${s.username}) | Prompt: ${(s.input_prompt || '').substring(0, 40)}...`);
});

console.log('\n📊 RESUMEN:');
console.log('─'.repeat(60));
console.log(`Total usuarios: ${users.length}`);
console.log(`Total sesiones: ${sessions.length}`);

db.close();
