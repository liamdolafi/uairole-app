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

## 3. Como o Uai Rolê está configurado
- O app **mostra os planos sempre**: os três lado a lado, o que cada um inclui, os preços e o botão **"Assinar"**
  (com "Só este evento" ou "Mensal").
- Uma chave em **Sócios → Config. → "Botão Assinar no app de celular"** decide pra onde o "Assinar" leva
  (uma pra iPhone e outra pra Android; colunas `app_plan_purchase_ios` e `app_plan_purchase_android`, 027):
  - **Desmarcada (padrão): abre a página de pagamento do site no navegador** (`/planos/assinar`).
  - **Marcada:** o pagamento (Pix/cartão pelo Mercado Pago) é feito dentro do próprio app.
- A chave vale na hora (não precisa publicar versão nova do app).

## 4. Por que o padrão é "abrir no site"
1. **Pagar dentro do app com Mercado Pago** um serviço digital é a violação mais clara da regra da Apple (3.1.1)
   e da Google (faturamento): é o tipo de coisa que faz o app ser recusado ou removido.
2. **Abrir a página do site** é o caminho que as lojas vêm liberando: nos EUA a Apple foi obrigada a permitir links
   pra compras fora do app (2025), e no Brasil o CADE também abriu processo contra a Apple sobre isso. Ainda assim,
   **dependendo do país e da época, a Apple pode recusar o botão** que leva pra compra externa: confira as regras atuais
   antes de enviar pra revisão.
3. A página do site é a mesma que já funciona no computador: um lugar só pra manter, testar e corrigir.
4. Sem taxa da loja (15% a 30%) em cima do plano.

## 5. Se a loja recusar
- Plano B rápido: avise o revisor que o Uai Rolê é uma ferramenta pra **empresas** (organizadores) e pergunte se o link
  é aceito; se não for, dá pra esconder o botão "Assinar" só no iPhone (pedir pra eu fazer: é uma mudança pequena).
- Plano C: implementar a compra da Apple/Google (In-App Purchase) pros planos (outra integração, com taxa da loja).
- Ingressos não mudam: podem ser vendidos no app com Mercado Pago (seção 1).

## Links pra conferir (versão atual)
- Apple — App Review Guidelines, seção 3.1: https://developer.apple.com/app-store/review/guidelines/#payments
- Google Play — Política de pagamentos: https://support.google.com/googleplay/android-developer/answer/9858738
