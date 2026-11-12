// Camada de dados do Prato Cheio — acesso ao banco.
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';
import { STATUS, PRAZO_RESERVA_MINUTOS } from './status.js';

export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    `INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *`,
    [tipo, quantidade, validade]
  );
  return rows[0];
}

export async function atualizarExpiradas() {
  await query(
    `UPDATE doacoes
     SET status = ?, reservada_por = NULL, reservada_em = NULL
     WHERE status = ? AND now() > reservada_em + (? * interval '1 minute')`,
    [STATUS.DISPONIVEL, STATUS.RESERVADA, PRAZO_RESERVA_MINUTOS]
  );
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
       WHERE status = ? AND LOWER(tipo) LIKE ? ESCAPE '\\'
       ORDER BY id`,
      [STATUS.DISPONIVEL, padrao]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT * FROM doacoes WHERE status = ? ORDER BY id`,
    [STATUS.DISPONIVEL]
  );
  return rows;
}

export async function buscarPorId(id) {
  await atualizarExpiradas();
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// Toda mudança de estado da doação segue o mesmo padrão (Decisão 2, Aula 6):
// um UPDATE só altera a linha se a doação AINDA estiver no estado esperado (`de`).
// É isso que torna a operação atômica — se duas ONGs (ou uma ONG e o doador)
// chegam ao mesmo tempo, só a primeira encontra a doação no estado `de`; a outra
// não altera nada e recebe `undefined`. O RETURNING * devolve a doação já
// atualizada, sem uma segunda consulta ao banco.
// `set` e `filtro` são trechos de SQL escritos neste arquivo, nunca vindos do
// usuário; os valores vão sempre como parâmetro.
async function transicionar(id, { de, para, set, valores = [], filtro, valoresFiltro = [] }) {
  await atualizarExpiradas();
  const { rows } = await query(
    `UPDATE doacoes
     SET status = ?, ${set}
     WHERE id = ? AND status = ?${filtro ? ` AND ${filtro}` : ''}
     RETURNING *`,
    [para, ...valores, id, de, ...valoresFiltro]
  );
  return rows[0];
}

// História zero: uma doação aceita não fica disponível para outra ONG.
export function aceitar(id, ong) {
  return transicionar(id, {
    de: STATUS.DISPONIVEL, para: STATUS.ACEITA,
    set: 'ong = ?', valores: [ong],
  });
}

// Decisão 2 (Aula 6): reserva com prazo; só a primeira ONG consegue reservar.
export function reservar(id, ong) {
  return transicionar(id, {
    de: STATUS.DISPONIVEL, para: STATUS.RESERVADA,
    set: 'reservada_por = ?, reservada_em = now()', valores: [ong],
  });
}

// Confirmação da reserva dentro do prazo, e só pela ONG que reservou.
export function confirmarReserva(id, ong) {
  return transicionar(id, {
    de: STATUS.RESERVADA, para: STATUS.ACEITA,
    set: 'ong = ?', valores: [ong],
    filtro: 'reservada_por = ?', valoresFiltro: [ong],
  });
}

// História 2 (Entrega 2): cancelamento pelo doador, só enquanto disponível.
export function cancelar(id, motivo) {
  return transicionar(id, {
    de: STATUS.DISPONIVEL, para: STATUS.CANCELADA,
    set: 'cancelada_em = now(), motivo_cancelamento = ?', valores: [motivo],
  });
}
