# Atividade de diagramas: Prato Cheio

Atividade em que o grupo gera dois diagramas UML do Prato Cheio com apoio de IA, critica o resultado e entrega uma versão evoluída.

## Integrantes

- Miguel Angel Balladares Huertas (@miguettohuertas)
- Miguel Angelo Dufloth Filho (@migueldufloth)
- Lucas Honorato dos Santos (@honoratoog)
- Leonardo Lotério de Lima (@leonardosth)

## Ferramenta de IA utilizada

Claude Sonnet 5.5 (Anthropic)

## Diagramas escolhidos

1. Diagrama de Estados (UML) da Doação
2. Diagrama de Sequência (UML) do aceite de uma doação por uma ONG

### Por que o Diagrama de Estados da Doação

Ele responde: **por quais situações uma doação passa desde que é publicada até deixar de estar disponível, e o que faz ela mudar de uma para outra?** Isso importa no Prato Cheio porque quase toda regra do produto é sobre o status da doação: ela nasce `disponivel`, só aparece na lista enquanto estiver assim, e depois de aceita não pode ser aceita por outra ONG (`docs/analise.md`, regras de negócio e histórias 2 e 3). Também há uma lacuna aberta, a doação aceita e não retirada, que a Decisão 1 da `docs/atividades/aula06.md` tenta fechar com expiração. Só olhando o ciclo de vida inteiro dá para enxergar essas transições e o que falta nelas.

### Por que o Diagrama de Sequência do aceite de doação

Ele responde: **quem conversa com quem, e em que ordem, quando uma ONG aceita uma doação?** O aceite é a operação mais delicada do sistema (história 3 e o risco de duas ONGs aceitarem a mesma doação ao mesmo tempo, em `docs/analise.md`). Passam por ela a ONG, a rota da API, as regras de negócio, o repositório e o banco, e a garantia de exclusividade depende de uma ordem específica: checar o status e, no `UPDATE ... WHERE status = 'disponivel'`, conferir de novo. O diagrama deixa essa ordem e os caminhos de erro visíveis.

### Como os dois se complementam

Os diagramas respondem perguntas diferentes. O de estados olha **uma doação ao longo do tempo** (ciclo de vida e transições permitidas). O de sequência olha **uma operação específica** e mostra a interação entre participantes e componentes (ONG, API, regra de negócio, repositório e banco) durante ela. O aceite aparece nos dois, mas em um é uma seta entre estados e no outro é uma troca de mensagens.

## Divisão de tarefas

| Integrante | O que fez |
|---|---|
| Miguel Angelo Dufloth Filho (@migueldufloth) | Estrutura da atividade, escolha e justificativa dos diagramas, este README, `contexto-ia.md` e o Pull Request |
| Miguel Angel Balladares Huertas (@miguettohuertas) | Versões iniciais geradas pela IA, em `ia-original/` |
| Lucas Honorato dos Santos (@honoratoog) | Análise crítica das versões da IA, em `analise-critica.md` |
| Leonardo Lotério de Lima (@leonardosth) | Versões finais dos diagramas e reflexão |

## Como encontrar a entrega

| Item | Caminho |
|---|---|
| Estados da doação, versão original da IA | `docs/diagramas/ia-original/estados-doacao.md` |
| Sequência do aceite, versão original da IA | `docs/diagramas/ia-original/sequencia-aceite-doacao.md` |
| Análise crítica | `docs/diagramas/analise-critica.md` |
| Estados da doação, versão final | `docs/diagramas/estados-doacao.md` |
| Sequência do aceite, versão final | `docs/diagramas/sequencia-aceite-doacao.md` |
| Reflexão | `docs/diagramas/reflexao.md` |

Material de entrada para a IA: [`contexto-ia.md`](contexto-ia.md).
