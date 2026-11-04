// Conexão com o banco — PostgreSQL (Unidade 3).
// A interface query(sql, valores) → { rows, alteradas } continua a mesma,
// então repositorio.js segue usando `?` como marcador.
import pg from 'pg';

const { Pool } = pg;
let pool;

export function conexao() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definida');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

// O PostgreSQL usa $1, $2... Convertemos aqui para não espalhar a mudança.
// Limitação: o SQL não pode ter um `?` literal dentro de texto.
function paraPostgres(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export async function query(sql, valores = []) {
  const r = await conexao().query(paraPostgres(sql), valores);
  return { rows: r.rows, alteradas: r.rowCount };
}

export async function migrar() {
  await query(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      tipo                TEXT NOT NULL,
      quantidade          TEXT NOT NULL,
      validade            TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'disponivel',
      ong                 TEXT,
      reservada_por       TEXT,
      reservada_em        TIMESTAMPTZ,
      cancelada_em        TIMESTAMPTZ,
      motivo_cancelamento TEXT,
      criada_em           TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export async function limparBanco() {
  await query('TRUNCATE doacoes RESTART IDENTITY');
}

export async function encerrar() {
  if (pool) { await pool.end(); pool = undefined; }
}
