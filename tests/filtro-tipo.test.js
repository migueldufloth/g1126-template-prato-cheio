// História 6 (Entrega 2): ONG filtra as doações disponíveis por tipo de alimento.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

async function publicar(tipo = 'Sopa', quantidade = '10 porções', validade = '2026-12-01') {
  const res = await request(app).post('/api/doacoes').send({ tipo, quantidade, validade });
  return res.body;
}

describe('filtrar doações disponíveis por tipo de alimento', () => {
  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  it('devolve só as doações cujo tipo contém o texto buscado', async () => {
    await publicar('Sopa de legumes');
    await publicar('Pão francês');
    await publicar('Sopa de feijão');

    const res = await request(app).get('/api/doacoes').query({ tipo: 'sopa' });

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.tipo)).toEqual(['Sopa de legumes', 'Sopa de feijão']);
  });

  it('ignora diferença entre maiúsculas e minúsculas', async () => {
    await publicar('Arroz com legumes');

    const res = await request(app).get('/api/doacoes').query({ tipo: 'ARROZ' });

    expect(res.body).toHaveLength(1);
  });

  it('devolve lista vazia, sem erro, quando nada corresponde', async () => {
    await publicar('Sopa');

    const res = await request(app).get('/api/doacoes').query({ tipo: 'pizza' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('sem filtro (ou com filtro em branco) devolve todas as disponíveis', async () => {
    await publicar('Sopa');
    await publicar('Pão');

    const semFiltro = await request(app).get('/api/doacoes');
    const filtroEmBranco = await request(app).get('/api/doacoes').query({ tipo: '   ' });

    expect(semFiltro.body).toHaveLength(2);
    expect(filtroEmBranco.body).toHaveLength(2);
  });

  it('não mostra doações canceladas, reservadas ou aceitas, mesmo que o tipo combine', async () => {
    const cancelada = await publicar('Sopa 1');
    const reservada = await publicar('Sopa 2');
    const aceita = await publicar('Sopa 3');
    await publicar('Sopa 4');
    await request(app).post(`/api/doacoes/${cancelada.id}/cancelar`);
    await request(app).post(`/api/doacoes/${reservada.id}/reservar`).send({ ong: 'ONG A' });
    await request(app).post(`/api/doacoes/${aceita.id}/aceitar`).send({ ong: 'ONG B' });

    const res = await request(app).get('/api/doacoes').query({ tipo: 'sopa' });

    expect(res.body.map((d) => d.tipo)).toEqual(['Sopa 4']);
  });

  it('trata % e _ digitados como texto comum, não como curinga do SQL', async () => {
    await publicar('Sopa');
    await publicar('Pão');

    const porcento = await request(app).get('/api/doacoes').query({ tipo: '%' });
    const sublinhado = await request(app).get('/api/doacoes').query({ tipo: '_' });

    expect(porcento.body).toEqual([]);
    expect(sublinhado.body).toEqual([]);
  });

  it('não é vulnerável a injeção de SQL no filtro', async () => {
    await publicar('Sopa');

    const res = await request(app).get('/api/doacoes').query({ tipo: "x' OR '1'='1" });
    const lista = await request(app).get('/api/doacoes');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(lista.body).toHaveLength(1);
  });

  it('recusa um filtro com mais de 50 caracteres', async () => {
    const res = await request(app).get('/api/doacoes').query({ tipo: 'a'.repeat(51) });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/50 caracteres/);
  });

  it('recusa um filtro repetido na URL (?tipo=a&tipo=b)', async () => {
    const res = await request(app).get('/api/doacoes?tipo=sopa&tipo=pao');

    expect(res.status).toBe(400);
  });
});
