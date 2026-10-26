// Regras de negócio das doações.
import * as repo from './repositorio.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];
const ERRO_JA_ACEITA = 'doação já foi aceita por outra ONG';

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade } = {}) {
  const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !{ tipo, quantidade, validade }[campo]);
  if (faltando.length > 0) {
    throw new Error(`campos obrigatórios ausentes: ${faltando.join(', ')}`);
  }
  return repo.inserir({ tipo, quantidade, validade });
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) throw new Error('doação não encontrada');
  if (doacao.status !== 'disponivel') throw new Error(ERRO_JA_ACEITA);

  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) throw new Error(ERRO_JA_ACEITA);
  return atualizada;
}

// Decisão 2 (Aula 6) — "uma ONG reserva uma doação temporariamente".
export async function reservar(id, ong) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) throw new Error('doação não encontrada');
  if (doacao.status !== 'disponivel') throw new Error('doação não está disponível para reserva');

  const atualizada = await repo.reservar(id, ong);
  if (!atualizada) throw new Error('doação não está disponível para reserva');
  return atualizada;
}

// Decisão 2 (Aula 6) — "uma ONG confirma a doação que reservou dentro do prazo".
export async function confirmarReserva(id, ong) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) throw new Error('doação não encontrada');
  if (doacao.status !== 'reservada') throw new Error('doação não está em estado de reserva');
  if (doacao.reservada_por !== ong) throw new Error('doação foi reservada por outra ONG');

  const atualizada = await repo.confirmarReserva(id, ong);
  if (!atualizada) throw new Error('reserva expirada ou inválida');
  return atualizada;
}

