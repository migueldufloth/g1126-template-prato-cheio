import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' });

    expect(res.status).toBe(400);
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('marca a doação como aceita pela ONG', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app).get('/api/doacoes');
    expect(res.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/aceitar`)
      .send({ ong: 'Outra ONG' });

    expect(res.status).toBe(400);
  });
});

describe('reservar e confirmar doação (Decisão 2 - Aula 6)', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('permite que uma ONG reserve uma doação disponível temporariamente', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    const res = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reservada');
    expect(res.body.reservada_por).toBe('ONG Resgate');
    expect(res.body.reservada_em).toBeDefined();
  });

  it('remove a doação reservada da listagem de disponíveis enquanto a reserva estiver ativa', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  it('recusa reservar uma doação inexistente', async () => {
    const res = await request(app)
      .post('/api/doacoes/9999/reservar')
      .send({ ong: 'ONG Resgate' });

    expect(res.status).toBe(400);
  });

  it('recusa reservar doação que já está reservada ou aceita', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    const res2 = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'Outra ONG' });

    expect(res2.status).toBe(400);
  });

  it('permite que a ONG que reservou confirme o aceite dentro do prazo', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    const resConfirmar = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/confirmar`)
      .send({ ong: 'ONG Resgate' });

    expect(resConfirmar.status).toBe(200);
    expect(resConfirmar.body.status).toBe('aceita');
    expect(resConfirmar.body.ong).toBe('ONG Resgate');
  });

  it('recusa confirmação de reserva por uma ONG diferente da que reservou', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    const resConfirmar = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/confirmar`)
      .send({ ong: 'Outra ONG' });

    expect(resConfirmar.status).toBe(400);
  });

  it('libera doação reservada de volta para disponível caso o prazo de reserva expire (timeout)', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'ONG Resgate' });

    // Simula expiração: altera reservada_em para 30 minutos atrás
    const { query } = await import('../src/db.js');
    await query(
      "UPDATE doacoes SET reservada_em = datetime('now', '-30 minutes') WHERE id = ?",
      [publicada.body.id]
    );

    // Ao listar, a doação deve reaparecer como disponível
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].status).toBe('disponivel');

    // E outra ONG agora consegue reservar
    const resNovaReserva = await request(app)
      .post(`/api/doacoes/${publicada.body.id}/reservar`)
      .send({ ong: 'Nova ONG' });
    expect(resNovaReserva.status).toBe(200);
    expect(resNovaReserva.body.status).toBe('reservada');
    expect(resNovaReserva.body.reservada_por).toBe('Nova ONG');
  });

  it('garante que apenas uma ONG vence a corrida de reserva simultânea (Promise.all)', async () => {
    const publicada = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz com legumes', quantidade: '20 marmitas', validade: '2026-08-02' });

    const [res1, res2] = await Promise.all([
      request(app).post(`/api/doacoes/${publicada.body.id}/reservar`).send({ ong: 'ONG A' }),
      request(app).post(`/api/doacoes/${publicada.body.id}/reservar`).send({ ong: 'ONG B' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 400]);
  });
});

