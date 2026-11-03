# Regras das lojas (App Store e Google Play) — o que pode vender dentro do app

> Resumo pra decidir. Não é conselho jurídico: as regras mudam e cada revisão é feita por uma pessoa.
> Antes de publicar, um adulto responsável deve conferir as versões atuais das regras (links no fim).

## 1. Ingressos de eventos: pode vender com Pix e cartão (Mercado Pago)
- Ingresso de evento que acontece **fora do app** (festa, show, pelada...) é um "serviço físico".
- **Apple** (Diretriz 3.1.3(e) e 3.1.5): bens e serviços usados fora do app **devem** usar outro meio de pagamento
  (não a compra dentro do app da Apple). Mercado Pago com Pix e cartão está certo.
- **Google Play** (Política de pagamentos): bens e serviços físicos ficam **fora** do Google Play Faturamento.
- Ou seja: a compra de ingresso no app pode ficar ligada sempre.

## 2. Planos Destaque e Holofote: cuidado
- O plano é um **serviço digital usado dentro do app** (o evento aparece mais no próprio Uai Rolê).
- **Apple** (Diretriz 3.1.1): conteúdo/recurso digital vendido no app tem que usar a **compra dentro do app da Apple**
  (In-App Purchase, com taxa de 15% a 30%). Também é proibido botão ou link levando pra comprar fora
  (no Brasil e em alguns países isso está mudando por decisões de órgãos de concorrência: confira antes).
- **Google Play**: em regra, bens digitais usados no app devem usar o Google Play Faturamento.
  Existem programas de "faturamento alternativo" em alguns países, inclusive com regras próprias.
- Exceção possível: vendas **entre empresas** (o organizador é um negócio) às vezes são aceitas fora da compra
  da loja, mas a decisão é do revisor. Não conte com isso sem perguntar à loja.

## 3. Como o Uai Rolê já está preparado
- O site vende os planos normalmente (site não tem essas regras).
- No app, a chave **liga/desliga** fica em **Sócios → Config. → "Comprar planos dentro do app de celular"**
  (uma pra iPhone e outra pra Android; colunas `app_plan_purchase_ios` e `app_plan_purchase_android`, 027).
  - **Desligada (padrão):** o app mostra os planos, o que cada um inclui e o seu plano atual, **sem preço,
    sem botão de comprar e sem dizer "compre no site"**. É o modo seguro pra revisão das lojas.
  - **Ligada:** o app mostra os preços e deixa pagar com Pix/cartão pelo Mercado Pago.
- A chave vale na hora (não precisa publicar versão nova do app).

## 4. Recomendação
1. Publicar nas lojas com a chave **desligada** nas duas plataformas.
2. Ingressos ligados (permitido).
3. Se um dia quiserem vender planos no app: implementar a compra da Apple/Google (outra integração, com taxa da loja)
   ou confirmar por escrito com a loja que a exceção vale pro Uai Rolê.

## Links pra conferir (versão atual)
- Apple — App Review Guidelines, seção 3.1: https://developer.apple.com/app-store/review/guidelines/#payments
- Google Play — Política de pagamentos: https://support.google.com/googleplay/android-developer/answer/9858738
