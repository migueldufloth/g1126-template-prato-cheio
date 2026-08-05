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
