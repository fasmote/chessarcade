/**
 * Script para borrar todos los scores del leaderboard
 *
 * ADVERTENCIA: Este script borra PERMANENTEMENTE todos los scores.
 * No hay forma de recuperarlos después de ejecutar esto.
 *
 * USO:
 *
 * 1. Asegurarte de tener DATABASE_URL en .env.local:
 *    DATABASE_URL=postgresql://...
 *
 * 2. Ejecutar:
 *    node scripts/clear-leaderboard.js
 *
 * 3. Confirmar con 'yes' cuando te pregunte
 */

import postgres from 'postgres';
import { createInterface } from 'readline';

// Leer DATABASE_URL del entorno
const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada');
  console.error('Agrega DATABASE_URL a tu archivo .env.local');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Interfaz para leer input del usuario
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function clearLeaderboard() {
  try {
    console.log('\n🎮 ChessArcade - Clear Leaderboard Script\n');

    // Contar scores actuales
    const countResult = await sql`SELECT COUNT(*) as total FROM scores`;
    const totalScores = parseInt(countResult[0].total);

    console.log(`📊 Scores actuales en la base de datos: ${totalScores}`);

    if (totalScores === 0) {
      console.log('✅ La base de datos ya está vacía.');
      process.exit(0);
    }

    // Mostrar desglose por juego
    console.log('\n📋 Desglose por juego:');
    const breakdown = await sql`
      SELECT game, COUNT(*) as count
      FROM scores
      GROUP BY game
      ORDER BY count DESC
    `;

    breakdown.forEach(row => {
      console.log(`   - ${row.game}: ${row.count} scores`);
    });

    // Confirmar
    console.log('\n⚠️  ADVERTENCIA: Esta acción NO se puede deshacer.\n');
    const answer = await ask('¿Estás seguro de que querés borrar TODOS los scores? (escribe "yes" para confirmar): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Operación cancelada.');
      process.exit(0);
    }

    // Borrar todos los scores
    console.log('\n🗑️  Borrando scores...');
    const result = await sql`DELETE FROM scores`;

    console.log(`✅ ${result.count} scores borrados exitosamente.`);

    // Verificar
    const newCount = await sql`SELECT COUNT(*) as total FROM scores`;
    console.log(`📊 Scores restantes: ${newCount[0].total}`);

    console.log('\n✅ Leaderboard limpiado completamente.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
    rl.close();
  }
}

// Ejecutar
clearLeaderboard();
