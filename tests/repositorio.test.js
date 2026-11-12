// Testes da camada de dados (Aula 13 — antes da refatoração do repositório).
// Os testes de "corrida" pela API não provocam corrida de verdade: as regras em
// doacoes.js conferem o status antes e as requisições acabam em sequência. Na
// revisão, tiramos a condição `AND status = ...` do UPDATE e todos os testes
// continuaram verdes. Estes chamam o repositório direto, pulando a verificação
// das regras, e provam que o próprio UPDATE recusa a segunda operação.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as repo from '../src/repositorio.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const nova = () => repo.inserir({ tipo: 'Arroz', quantidade: '3 kg', validade: '2026-12-20' });

describe('repositório: a mudança de estado só acontece uma vez', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('a segunda reserva da mesma doação não altera nada', async () => {
    const { id } = await nova();
    const primeira = await repo.reservar(id, 'ONG A');
    const segunda = await repo.reservar(id, 'ONG B');

    expect(primeira).toMatchObject({ id, status: 'reservada', reservada_por: 'ONG A' });
    expect(segunda).toBeUndefined();
    expect(await repo.buscarPorId(id)).toMatchObject({ reservada_por: 'ONG A' });
  });

  it('duas reservas simultâneas: exatamente uma vence', async () => {
    const { id } = await nova();
    const resultados = await Promise.all([repo.reservar(id, 'ONG A'), repo.reservar(id, 'ONG B')]);
    expect(resultados.filter(Boolean)).toHaveLength(1);
  });

  it('não aceita uma doação que já foi aceita', async () => {
    const { id } = await nova();
    await repo.aceitar(id, 'ONG A');
    expect(await repo.aceitar(id, 'ONG B')).toBeUndefined();
    expect(await repo.buscarPorId(id)).toMatchObject({ status: 'aceita', ong: 'ONG A' });
  });

  it('não cancela uma doação reservada', async () => {
    const { id } = await nova();
    await repo.reservar(id, 'ONG A');
    expect(await repo.cancelar(id, 'mudei de ideia')).toBeUndefined();
    expect(await repo.buscarPorId(id)).toMatchObject({ status: 'reservada', cancelada_em: null });
  });

  it('só a ONG que reservou consegue confirmar', async () => {
    const { id } = await nova();
    await repo.reservar(id, 'ONG A');
    expect(await repo.confirmarReserva(id, 'ONG B')).toBeUndefined();
    expect(await repo.confirmarReserva(id, 'ONG A')).toMatchObject({ status: 'aceita', ong: 'ONG A' });
  });

  it('devolve a doação atualizada com os campos da transição', async () => {
    const { id } = await nova();
    const cancelada = await repo.cancelar(id, 'estragou');
    expect(cancelada).toMatchObject({ id, status: 'cancelada', motivo_cancelamento: 'estragou' });
    expect(cancelada.cancelada_em).toBeInstanceOf(Date);
  });
});
