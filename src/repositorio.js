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

// História 6 (Entrega 2) — "ONG filtra as doações disponíveis por tipo de alimento".
// O filtro é parcial e sem diferença de maiúsculas/minúsculas. Os curingas do
// LIKE (% e _) digitados pelo usuário são escapados, para valerem como texto.
export async function listarDisponiveis({ tipo } = {}) {
  await atualizarExpiradas();
  if (tipo) {
    const padrao = `%${tipo.toLowerCase().replace(/[\\%_]/g, '\\$&')}%`;
    const { rows } = await query(
      `SELECT * FROM doacoes
       WHERE status = 'disponivel' AND LOWER(tipo) LIKE ? ESCAPE '\\'
       ORDER BY id`,
      [padrao]
    );
    return rows;
  }
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

// História 2 (Entrega 2): cancelamento pelo doador.
// Mesmo padrão do aceite e da reserva: o `AND status = 'disponivel'` torna a
// operação atômica, então cancelar e reservar ao mesmo tempo não dão certo os dois.
export async function cancelar(id, motivo) {
  await atualizarExpiradas();
  const { alteradas } = await query(
    `UPDATE doacoes
     SET status = 'cancelada', cancelada_em = datetime('now'), motivo_cancelamento = ?
     WHERE id = ? AND status = 'disponivel'`,
    [motivo, id]
  );
  if (alteradas === 0) return undefined;
  return buscarPorId(id);
}
