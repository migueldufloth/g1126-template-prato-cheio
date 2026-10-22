# Contexto do Prato Cheio para a IA

Texto de entrada para gerar a versão inicial dos dois diagramas: Diagrama de Estados da Doação e Diagrama de Sequência do aceite de uma doação por uma ONG. Foi tirado dos documentos do repositório e não descreve código.

## O caso

Restaurantes, padarias, mercados e produtores geram excedente de comida que ainda poderia ser consumida, mas acaba descartada porque não há um canal simples entre quem tem o alimento e quem pode redistribuí-lo. As ONGs que atendem pessoas em insegurança alimentar dependem de contatos informais (telefone, WhatsApp), o que é lento e muitas vezes chega tarde.

O Prato Cheio é um canal único: o doador publica o que tem sobrando e a ONG vê as doações disponíveis e reserva uma antes que outra instituição o faça ou que o alimento se perca. A versão atual é um walking skeleton, sem autenticação e sem geolocalização.

## Atores

- **Doador**: estabelecimento que publica uma doação.
- **ONG**: instituição que consulta as doações disponíveis e aceita uma.
- O beneficiário final não usa o sistema.

## Histórias de usuário

1. Como doador, quero publicar uma doação com tipo, quantidade e validade, para que uma ONG saiba que o alimento existe antes que vença.
2. Como ONG, quero ver a lista de doações disponíveis, para escolher qual reservar antes que outra instituição o faça.
3. Como ONG, quero aceitar uma doação disponível, para garantir que ela seja destinada à minha instituição.

## Regras de negócio

- Toda doação precisa de tipo, quantidade e validade. Sem os três, a publicação é recusada.
- Uma doação nasce com status `disponivel` e só aparece na lista de doações enquanto estiver nesse status.
- Uma doação só pode ser aceita por uma ONG. Quando uma ONG aceita, o status passa a `aceita`, o nome da ONG é registrado e a doação sai da lista de disponíveis.
- Se outra ONG tentar aceitar uma doação que já foi aceita, o pedido é recusado com erro. Isso vale mesmo quando as duas tentativas chegam quase ao mesmo tempo.
- Tentar aceitar uma doação que não existe também é recusado com erro.
- Não há edição nem cancelamento de doação, e não há autenticação de doador ou ONG.

## Status da doação que existem hoje

- `disponivel`
- `aceita`

Não existe ainda nenhum outro status nem transição de volta de `aceita` para `disponivel`.

## Lacuna conhecida

O que acontece com uma doação aceita que a ONG não retira não está definido. Hoje ela fica `aceita` para sempre.

## Decisões de projeto já tomadas, ainda não implementadas

Registradas em `docs/atividades/aula06.md`. Se forem usadas nos diagramas, devem aparecer marcadas como previstas, separadas do que existe hoje.

- Uma doação aceita e não retirada deve voltar sozinha para `disponivel` depois de um prazo, verificado no momento em que a doação é consultada. Para isso seria preciso registrar quando a doação foi aceita.
- Em vez de aceitar direto, a ONG passaria a reservar a doação por um prazo curto (15 a 30 minutos) e depois confirmar. Isso criaria um status `reservada` entre `disponivel` e `aceita`. Se a ONG desistir ou o prazo acabar, a doação volta a `disponivel`.

## O que cada diagrama deve mostrar

**Diagrama de Estados da Doação**: os status da doação, o que dispara cada transição e as condições (por exemplo, só se aceita uma doação `disponivel`).

**Diagrama de Sequência do aceite**: uma ONG aceita uma doação. Participantes: ONG, API do Prato Cheio, regras de negócio das doações, acesso ao banco e banco de dados. Deve incluir o caminho feliz e os caminhos de erro: doação inexistente e doação já aceita (inclusive quando outra ONG aceita entre a verificação e a gravação).
