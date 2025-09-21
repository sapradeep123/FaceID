-- Required extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Tenancy: branches, devices
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL DEFAULT 'default',
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
  device_code VARCHAR(128) UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Users + images
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  org_id VARCHAR(64) DEFAULT 'default',
  branch_id INT REFERENCES branches(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS face_images (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  image_bytes BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings (ArcFace 512-d) with branch isolation
CREATE TABLE IF NOT EXISTS face_embeddings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  branch_id INT REFERENCES branches(id),
  embedding vector(512),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_face_embeddings_ann
  ON face_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_embeddings_branch ON face_embeddings(branch_id);

-- Audit to detect sharing
CREATE TABLE IF NOT EXISTS auth_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id INT,
  branch_id INT,
  device_code VARCHAR(128),
  challenge VARCHAR(32),
  ok BOOLEAN,
  confidence REAL,
  created_at TIMESTAMP DEFAULT NOW()
);