CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS upload_batches (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  total_tournaments INTEGER NOT NULL,
  net_profit REAL NOT NULL,
  normal_deal REAL NOT NULL,
  automatic_sale REAL NOT NULL,
  submitted_to_polarize BOOLEAN DEFAULT FALSE,
  polarize_session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  tournament_id TEXT,
  buy_in REAL NOT NULL,
  buy_in_original TEXT,
  result REAL NOT NULL,
  normal_deal REAL NOT NULL,
  automatic_sale REAL NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  conversion_rate REAL DEFAULT 1,
  upload_batch_id TEXT NOT NULL,
  original_filename TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);