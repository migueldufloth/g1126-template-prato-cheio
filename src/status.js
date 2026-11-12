// Vocabulário da doação, num lugar só.
// Os estados são os do diagrama de estados (docs/diagramas/estados-doacao.md).
export const STATUS = Object.freeze({
  DISPONIVEL: 'disponivel',
  RESERVADA: 'reservada',
  ACEITA: 'aceita',
  CANCELADA: 'cancelada',
});

// Decisão 2 (Aula 6): por quanto tempo uma reserva segura a doação para a ONG.
export const PRAZO_RESERVA_MINUTOS = 20;
