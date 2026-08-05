// Regras de negócio das doações.
import * as repo from './repositorio.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

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
  if (doacao.status !== 'disponivel') throw new Error('doação já foi aceita por outra ONG');

  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) throw new Error('doação já foi aceita por outra ONG');
  return atualizada;
}
