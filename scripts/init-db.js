// Script para inicializar o banco de dados
import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  try {
    console.log('Iniciando conexão com o banco de dados PostgreSQL...');

    // Criar uma conexão com o banco de dados usando variáveis de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Testar a conexão
    await pool.query('SELECT NOW()');
    console.log('Conectado com sucesso ao PostgreSQL!');

    // Ler e executar o script SQL para criar as tabelas
    const sqlFilePath = path.join(__dirname, '../migrations/schema.sql');
    const schemaSQL = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executando script de esquema SQL...');
    await pool.query(schemaSQL);

    console.log('Banco de dados inicializado com sucesso!');
    
    // Fechar a conexão
    await pool.end();
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
    process.exit(1);
  }
}

// Executar a função de inicialização
initializeDatabase();