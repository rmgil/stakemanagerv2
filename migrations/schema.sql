-- Inicialização do esquema de banco de dados para o Polarize Poker Tournament Tracker

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

-- Tabela de lotes de upload
CREATE TABLE IF NOT EXISTS "upload_batches" (
  "id" TEXT PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "total_tournaments" INTEGER NOT NULL,
  "net_profit" REAL NOT NULL,
  "normal_deal" REAL NOT NULL,
  "automatic_sale" REAL NOT NULL,
  "submitted_to_polarize" BOOLEAN DEFAULT FALSE,
  "polarize_session_id" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Tabela de torneios
CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tournament_id" TEXT,
  "buy_in" REAL NOT NULL,
  "buy_in_original" TEXT,
  "result" REAL NOT NULL,
  "normal_deal" REAL NOT NULL,
  "automatic_sale" REAL NOT NULL,
  "currency_code" TEXT DEFAULT 'USD',
  "conversion_rate" REAL DEFAULT 1,
  "upload_batch_id" TEXT NOT NULL,
  "original_filename" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  FOREIGN KEY ("upload_batch_id") REFERENCES "upload_batches" ("id")
);

-- Criação de um usuário padrão para desenvolvimento
INSERT INTO "users" ("username", "password")
VALUES ('demo', 'password123')
ON CONFLICT DO NOTHING;