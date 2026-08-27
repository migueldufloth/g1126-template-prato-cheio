# Atividade 4 — Critérios de aceite, hipóteses e riscos e esqueleto rodando

*Atividade de aula (0,25 pt) · entrega 9 de setembro de 2026, 23:59*

> Este documento é o **esqueleto** da entrega. Ele organiza o que a atividade pede, aponta o
> que já está coberto em outros documentos do repositório (e onde) e marca com `TODO` o que
> ainda precisa ser escrito — de propósito, para que outro integrante do grupo complete e
> registre a própria contribuição (commit) nesta atividade.

## Status geral

| # | Item pedido na atividade | Situação | Onde |
|---|---|---|---|
| 1 | Critérios de aceite (Dado/Quando/Então) para 3 histórias | `TODO` — revisar/adaptar | ver §1, base em `docs/analise.md` |
| 2 | Suposição → hipótese testável + desenho de experimento | `TODO` — escrever | ver §2 |
| 3 | 2 riscos do caso + mitigação concreta | `TODO` — escrever | ver §3 |
| 4 | Código rodando (walking skeleton) passando nos testes | ✅ feito, na `main` | ver §4 |
| 5 | Tudo documentado | `TODO` — fechar após 1–4 | ver §5 |
| 6 | Material de consulta para a prova (à mão) | fora deste PR — pessoal, sem IA | ver §6 |

## 1. Critérios de aceite (Dado/Quando/Então) — 3 histórias do caso

`TODO` (responsável: _preencher_)

Já existe uma versão pronta em `docs/analise.md`, seção "Critérios de aceite", cobrindo
exatamente as 3 histórias do walking skeleton (doador publica, ONG vê a lista, ONG aceita).

O que falta aqui não é escrever do zero, e sim **decidir e registrar**:
- Reaproveitar esses critérios como estão (linkar/copiar), ou
- Escrever critérios de aceite para **outras 3 histórias** do caso — por exemplo, das que
  aparecem em `user-stories.md` (Aula 03) e ainda não têm critério de aceite formal, o que
  teria mais valor para preparar o Trabalho 2.

Formato esperado por história (Gherkin simplificado):
```
Dado que <contexto>
Quando <ação>
Então <resultado esperado>
```

## 2. Suposição do caso → hipótese testável + experimento

`TODO` (responsável: _preencher_)

`docs/analise.md` já tem uma hipótese geral (seção "Hipótese e experimento"). Esta atividade
pede algo mais específico: partir de **uma suposição pontual** do caso — por exemplo, uma das
listadas em "Incertezas" no mesmo documento (ex.: *"doadores vão lembrar de publicar a doação
no momento em que o excedente surge"*) — e transformá-la em:

- **Hipótese testável**, no formato "Acreditamos que `<ação/mudança>` resulta em
  `<resultado mensurável>`, medido por `<métrica>`."
- **Experimento**: o que seria observado/medido, com quem, por quanto tempo, e qual resultado
  confirmaria ou refutaria a hipótese (critério de sucesso/falha definido *antes* de rodar).

## 3. Dois riscos do caso + mitigação concreta

`TODO` (responsável: _preencher_)

`docs/analise.md` já lista 4 riscos (seção "Riscos"). Para esta atividade, escolher **2**
(podem ser desses 4 ou riscos novos) e detalhar uma mitigação **concreta e acionável** —
não só a estratégia genérica que já está na tabela, mas o que fazer, quem faz e quando.

| Risco | Probabilidade | Impacto | Mitigação concreta (ação + responsável + prazo) |
|---|---|---|---|
| | | | |
| | | | |

## 4. Código executando — walking skeleton passando nos testes

✅ Já implementado e mesclado na `main` (Trabalho 1 / PRs #1 e #2).

Evidência (rodada em 27/08/2026):
```
$ npm test
✓ tests/doacoes.test.js (6 tests) 62ms
Test Files  1 passed (1)
     Tests  6 passed (6)
```

`TODO` (quem abrir/atualizar este PR): rodar `npm test` de novo no momento da entrega e colar
o resultado atualizado aqui, para a evidência ficar datada da própria atividade.

## 5. Tudo documentado

`TODO`: depois que §1–§3 estiverem preenchidos, revisar este arquivo inteiro e confirmar que:
- os critérios de aceite batem com o comportamento real da API (rodar os testes correspondentes);
- a hipótese e o experimento fazem sentido dentro do escopo do walking skeleton;
- os riscos e mitigações são específicos ao Prato Cheio, não genéricos;
- a seção "Uso de IA" abaixo está preenchida com o que cada um usou.

## 6. Material de consulta para a prova

Fora do escopo deste PR — é individual, escrito à mão, sem uso de IA (contrato pedagógico da
disciplina). Cada integrante organiza a própria cola a partir do que entender do repositório.

## Divisão do trabalho

| Item | Responsável | Status |
|---|---|---|
| §1 Critérios de aceite | _a definir_ | TODO |
| §2 Hipótese + experimento | _a definir_ | TODO |
| §3 Riscos + mitigação | _a definir_ | TODO |
| §4 Evidência dos testes | _a definir_ | TODO |
| §5 Revisão final | _a definir_ | TODO |
| Revisão e aprovação do PR | _a definir_ (outro integrante, não quem escreveu) | TODO |

## Uso de IA

Usamos o Claude para montar o **esqueleto** deste documento: mapear os 6 itens pedidos pela
atividade contra o que já existe em `docs/analise.md` e `user-stories.md`, e organizar o que
falta em seções com `TODO` claros. Nenhum conteúdo final (critérios, hipótese, riscos) foi
gerado pela IA — cada integrante preenche e registra abaixo o que usou ao completar sua parte:

- _[integrante]_: usei IA para ___, alterei ___.
