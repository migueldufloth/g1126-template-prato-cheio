// Camada de dados do Prato Cheio — acesso ao banco.
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function listarDisponiveis() {
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id`
  );
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// A cláusula `status = 'disponivel'` garante que duas ONGs não aceitem a
// mesma doação: se outra ONG já aceitou, `alteradas` vem 0.
export async function aceitar(id, ong) {
  const { alteradas } = await query(
    `UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  if (alteradas === 0) return undefined;
  return buscarPorId(id);
}
