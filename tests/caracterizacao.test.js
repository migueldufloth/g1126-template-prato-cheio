// Testes de caracterização (Aula 13 — antes de refatorar).
// Os testes existentes conferem quase só o status HTTP. Estes fixam o que a API
// devolve hoje — mensagem de erro exata, ONG padrão, prazo da reserva — para que
// as refatorações não mudem o comportamento sem ninguém perceber.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const app = criarApp();

async function publicar() {
  const res = await request(app)
    .post('/api/doacoes')
    .send({ tipo: 'Feijão', quantidade: '5 kg', validade: '2026-12-10' });
  return res.body.id;
}

const acao = (id, nome, corpo = {}) =>
  request(app).post(`/api/doacoes/${id}/${nome}`).send(corpo);

async function esperarErro(promessa, mensagem) {
  const res = await promessa;
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ erro: mensagem });
}

async function envelhecerReserva(id, minutos) {
  await query(
    `UPDATE doacoes SET reservada_em = now() - (? * interval '1 minute') WHERE id = ?`,
    [minutos, id]
  );
}

describe('caracterização: mensagens de erro da API', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('publicar sem campos lista os que faltam, na ordem tipo, quantidade, validade', async () => {
    await esperarErro(
      request(app).post('/api/doacoes').send({ tipo: 'Sopa' }),
      'campos obrigatórios ausentes: quantidade, validade'
    );
    await esperarErro(
      request(app).post('/api/doacoes').send({}),
      'campos obrigatórios ausentes: tipo, quantidade, validade'
    );
  });

  it('filtro longo demais devolve a mensagem com o limite', async () => {
    await esperarErro(
      request(app).get('/api/doacoes').query({ tipo: 'x'.repeat(51) }),
      'filtro de tipo deve ter no máximo 50 caracteres'
    );
  });

  it('aceitar: inexistente, já aceita, reservada e cancelada', async () => {
    await esperarErro(acao(9999, 'aceitar', { ong: 'A' }), 'doação não encontrada');

    const aceita = await publicar();
    await acao(aceita, 'aceitar', { ong: 'A' });
    await esperarErro(acao(aceita, 'aceitar', { ong: 'B' }), 'doação já foi aceita por outra ONG');

    // Comportamento atual: uma doação reservada também responde "já foi aceita".
    const reservada = await publicar();
    await acao(reservada, 'reservar', { ong: 'A' });
    await esperarErro(acao(reservada, 'aceitar', { ong: 'B' }), 'doação já foi aceita por outra ONG');

    const cancelada = await publicar();
    await acao(cancelada, 'cancelar');
    await esperarErro(acao(cancelada, 'aceitar', { ong: 'A' }), 'doação foi cancelada pelo doador');
  });

  it('reservar: inexistente, indisponível e cancelada', async () => {
    await esperarErro(acao(9999, 'reservar', { ong: 'A' }), 'doação não encontrada');

    const id = await publicar();
    await acao(id, 'reservar', { ong: 'A' });
    await esperarErro(acao(id, 'reservar', { ong: 'B' }), 'doação não está disponível para reserva');

    const cancelada = await publicar();
    await acao(cancelada, 'cancelar');
    await esperarErro(acao(cancelada, 'reservar', { ong: 'A' }), 'doação foi cancelada pelo doador');
  });

  it('confirmar: inexistente, sem reserva, outra ONG e reserva vencida', async () => {
    await esperarErro(acao(9999, 'confirmar', { ong: 'A' }), 'doação não encontrada');

    const semReserva = await publicar();
    await esperarErro(acao(semReserva, 'confirmar', { ong: 'A' }), 'doação não está em estado de reserva');

    const id = await publicar();
    await acao(id, 'reservar', { ong: 'A' });
    await esperarErro(acao(id, 'confirmar', { ong: 'B' }), 'doação foi reservada por outra ONG');

    // A reserva vencida já voltou a `disponivel` quando a regra consulta a doação.
    await envelhecerReserva(id, 30);
    await esperarErro(acao(id, 'confirmar', { ong: 'A' }), 'doação não está em estado de reserva');
  });

  it('cancelar: inexistente, reservada, aceita e já cancelada', async () => {
    await esperarErro(acao(9999, 'cancelar'), 'doação não encontrada');

    const reservada = await publicar();
    await acao(reservada, 'reservar', { ong: 'A' });
    await esperarErro(acao(reservada, 'cancelar'), 'doação está reservada por uma ONG e não pode ser cancelada');

    const aceita = await publicar();
    await acao(aceita, 'aceitar', { ong: 'A' });
    await esperarErro(acao(aceita, 'cancelar'), 'doação já foi aceita por uma ONG e não pode ser cancelada');

    const cancelada = await publicar();
    await acao(cancelada, 'cancelar');
    await esperarErro(acao(cancelada, 'cancelar'), 'doação já foi cancelada');
  });
});

describe('caracterização: valores padrão e prazo da reserva', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('sem `ong` no corpo, aceitar registra a ONG como "ONG"', async () => {
    const id = await publicar();
    const res = await request(app).post(`/api/doacoes/${id}/aceitar`);
    expect(res.status).toBe(200);
    expect(res.body.ong).toBe('ONG');
  });

  it('sem `ong` no corpo, reservar e confirmar usam "ONG"', async () => {
    const id = await publicar();
    const reserva = await request(app).post(`/api/doacoes/${id}/reservar`);
    expect(reserva.body.reservada_por).toBe('ONG');

    const confirmada = await request(app).post(`/api/doacoes/${id}/confirmar`);
    expect(confirmada.status).toBe(200);
    expect(confirmada.body).toMatchObject({ status: 'aceita', ong: 'ONG' });
  });

  it('a operação devolve a doação completa, com todos os campos', async () => {
    const id = await publicar();
    const res = await acao(id, 'reservar', { ong: 'A' });
    expect(Object.keys(res.body).sort()).toEqual([
      'cancelada_em', 'criada_em', 'id', 'motivo_cancelamento', 'ong',
      'quantidade', 'reservada_em', 'reservada_por', 'status', 'tipo', 'validade',
    ]);
    expect(res.body).toMatchObject({ id, tipo: 'Feijão', status: 'reservada', reservada_por: 'A' });
  });

  it('reserva com 19 minutos ainda está ativa', async () => {
    const id = await publicar();
    await acao(id, 'reservar', { ong: 'A' });
    await envelhecerReserva(id, 19);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
    const confirmada = await acao(id, 'confirmar', { ong: 'A' });
    expect(confirmada.status).toBe(200);
  });

  it('reserva com 21 minutos já expirou e volta à lista', async () => {
    const id = await publicar();
    await acao(id, 'reservar', { ong: 'A' });
    await envelhecerReserva(id, 21);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ id, status: 'disponivel', reservada_por: null, reservada_em: null });
  });
});
