// História 7 (Entrega 3): doador adiciona observações de retirada ao publicar.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();
const base = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-12-01' };

describe('observações de retirada na publicação da doação', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('guarda as observações e mostra na lista de disponíveis', async () => {
    const res = await request(app).post('/api/doacoes')
      .send({ ...base, observacoes: 'retirar na portaria B' });
    expect(res.status).toBe(201);
    expect(res.body.observacoes).toBe('retirar na portaria B');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body[0].observacoes).toBe('retirar na portaria B');
  });

  it('observações são opcionais', async () => {
    const res = await request(app).post('/api/doacoes').send(base);
    expect(res.status).toBe(201);
    expect(res.body.observacoes).toBeNull();
  });

  it('texto em branco vira sem observações', async () => {
    const res = await request(app).post('/api/doacoes').send({ ...base, observacoes: '   ' });
    expect(res.status).toBe(201);
    expect(res.body.observacoes).toBeNull();
  });

  it('recusa observações com mais de 200 caracteres', async () => {
    const res = await request(app).post('/api/doacoes')
      .send({ ...base, observacoes: 'a'.repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/200 caracteres/);
  });

  it('recusa observações que não sejam texto', async () => {
    const res = await request(app).post('/api/doacoes').send({ ...base, observacoes: 123 });
    expect(res.status).toBe(400);
  });
});
