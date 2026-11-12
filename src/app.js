import express from 'express';
import * as doacoes from './doacoes.js';

// Toda rota da API segue o mesmo contrato: sucesso devolve o resultado em JSON,
// erro de regra de negócio devolve 400 com { erro: mensagem }.
// O contrato fica num lugar só, em vez de copiado em cada rota.
function rota(executar, statusSucesso = 200) {
  return async (req, res) => {
    try {
      res.status(statusSucesso).json(await executar(req));
    } catch (erro) {
      res.status(400).json({ erro: erro.message });
    }
  };
}

// Sem `ong` no corpo, a operação é registrada em nome de "ONG".
const ongDa = (req) => req.body?.ong ?? 'ONG';

export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.get('/api/doacoes', rota((req) => doacoes.listarDisponiveis({ tipo: req.query.tipo })));
  app.post('/api/doacoes', rota((req) => doacoes.criarDoacao(req.body), 201));

  app.post('/api/doacoes/:id/aceitar', rota((req) => doacoes.aceitar(req.params.id, ongDa(req))));
  app.post('/api/doacoes/:id/reservar', rota((req) => doacoes.reservar(req.params.id, ongDa(req))));
  app.post('/api/doacoes/:id/confirmar', rota((req) => doacoes.confirmarReserva(req.params.id, ongDa(req))));

  // História 2: o doador cancela uma doação que ainda está disponível.
  app.post('/api/doacoes/:id/cancelar', rota((req) => doacoes.cancelar(req.params.id, { motivo: req.body?.motivo })));

  return app;
}
