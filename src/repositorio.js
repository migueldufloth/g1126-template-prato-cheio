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

export async function atualizarExpiradas() {
  await query(`
    UPDATE doacoes
    SET status = 'disponivel', reservada_por = NULL, reservada_em = NULL
    WHERE status = 'reservada' AND datetime('now') > datetime(reservada_em, '+20 minutes')
  `);
}

export async function listarDisponiveis() {
  await atualizarExpiradas();
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id`
  );
  return rows;
}

export async function buscarPorId(id) {
  await atualizarExpiradas();
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// A cláusula `status = 'disponivel'` garante que duas ONGs não aceitem a
// mesma doação: se outra ONG já aceitou, `alteradas` vem 0.
export async function aceitar(id, ong) {
  await atualizarExpiradas();
  const { alteradas } = await query(
    `UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  if (alteradas === 0) return undefined;
  return buscarPorId(id);
}

// Decisão 2 (Aula 6): Reserva com prazo.
// Atualização atômica garante que apenas a primeira ONG consiga reservar a doação.
export async function reservar(id, ong) {
  await atualizarExpiradas();
  const { alteradas } = await query(
    `UPDATE doacoes
     SET status = 'reservada', reservada_por = ?, reservada_em = datetime('now')
     WHERE id = ? AND status = 'disponivel'`,
    [ong, id]
  );
  if (alteradas === 0) return undefined;
  return buscarPorId(id);
}

// Confirmação formal da reserva dentro do prazo pela mesma ONG.
export async function confirmarReserva(id, ong) {
  await atualizarExpiradas();
  const { alteradas } = await query(
    `UPDATE doacoes
     SET status = 'aceita', ong = ?
     WHERE id = ? AND status = 'reservada' AND reservada_por = ?`,
    [ong, id, ong]
  );
  if (alteradas === 0) return undefined;
  return buscarPorId(id);
}
