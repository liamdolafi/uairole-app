# Uai Rolê App — TODO

Legenda: `[ ]` a fazer · `[x]` pronto. Depois de cada bloco: `npm run typecheck` + `npm run lint` + commit.

## 1. Base
- [x] Expo SDK 58 + TypeScript + Expo Router (rotas em `src/app/`)
- [x] Mesmo Supabase do site, chaves no `.env` (no `.gitignore`)
- [x] Sessão salva com segurança (criptografada, chave no cofre do celular)
- [x] Visual igual ao site: cores, fontes Geist/Bricolage, ícone do site, tema escuro
- [x] Componentes base: botão, chip, campo, avisos, carregando, vazio, painel de baixo

## 2. Login
- [x] Cadastro com código de 6 dígitos (nome, e-mail, senha, nascimento, aceite dos termos)
- [x] Login; conta sem confirmar manda código novo e leva pra tela do código
- [x] Esqueci a senha com código → tela de senha nova
- [x] Reenviar código com espera de 60 s, colar/autopreencher o código
- [x] Conta sem data de nascimento: pede a data na primeira entrada
- [ ] Liam: modelos de e-mail do Supabase com `{{ .Token }}` (precisa de SMTP próprio)

## 3. Telas do usuário
- [x] Descobrir: Em destaque (Holofote), Bombando agora, filtros (Agora/Hoje/Amanhã/Fim de semana, categoria, bairro, preço), busca
- [x] Mapa: pinos por categoria (Rolê da noite maior e com brilho), mini-card, minha localização
- [x] Feed: Recentes/Em alta, fixados, postar com foto (câmera/galeria) e marcação, curtir, responder, compartilhar, denunciar, apagar
- [x] Favoritos + "Seguindo" + "Já rolaram"
- [x] Perfil: dados, foto (câmera/galeria), nome, organizador, amigos, privacidade, notificações, avisos, sair
- [x] Evento: detalhes, preços, Eu vou, amigos que vão, termômetro, check-in com localização, avaliações, posts, compartilhar, como chegar, ingresso, denunciar
- [x] Local: mapa, seguir, próximos rolês, preços, como chegar, compartilhar
- [x] Organizador: seguir, próximos rolês
- [x] Pessoa: adicionar/aceitar/desfazer amizade, bloquear/desbloquear
- [x] Amigos: rolês dos amigos (hoje/fim de semana), busca, pedidos
- [x] Avisos (o mesmo 🔔 do site), tocando abre a tela certa

## 4. Funções de celular
- [x] Localização só na hora (check-in e minha localização)
- [x] Câmera e galeria (foto diminuída pra JPEG antes de enviar)
- [x] Compartilhar pelo menu do celular com o link do site
- [x] Como chegar abre o app de mapas
- [x] Painel, Admin e Sócios abrem o site no navegador (só pra quem tem acesso)
- [x] Push: `023_app_push.sql` (tokens dos aparelhos + envio pelo banco: Rolê da noite, amigos, sócio) — testado no PGlite
- [x] Push no app: ativar/desativar em Privacidade, tocar na notificação abre a tela certa, sair da conta apaga o token
- [x] Liam: rodar `023_app_push.sql` no SQL Editor do Supabase
- [ ] Liam: criar conta na Expo, rodar `npx eas-cli@latest init` (gera o projectId) e `eas build --profile development` (veja a seção 10)

## 5. Antes de publicar nas lojas
- [ ] Liam: rodar `009_recorrencia.sql` (o banco ainda não tem as séries; o app funciona sem)
- [ ] Chave do Google Maps pro Android (só pra build de loja)
- [ ] Ícone monocromático do Android e splash caprichada
- [ ] Testar em iPhone e Android de verdade (check-in a menos de 200 m, push, fotos)
- [ ] Contas de desenvolvedor (Apple US$ 99/ano, Google US$ 25 uma vez) e `eas submit`

## 6. Apresentação
- [x] Sem textos técnicos/provisórios visíveis (aviso de push no Expo Go reescrito)
- [x] Repositório no GitHub (liamdolafi/uairole-app) conectado e com push

## 7. Logo novo
- [x] Ícone, ícone adaptativo do Android, splash, favicon e ícone de notificação com o logo novo (pino ao vivo)

## 8. Versão final
- [x] Sem emojis: ícones lucide-react-native em tudo (abas, botões, selos, avisos)
- [x] Ilustrações das categorias nas capas sem foto, cards, evento e pinos
- [x] Holofote no lugar de "Rolê da noite" (carrossel "Em destaque", selo, push)
- [x] Preço em números ("a partir de", "até", grátis) com faixa $ calculada
- [x] Painel de filtros completo (quando + calendário, categoria, bairro, preço com duas bolinhas, idade, distância, ordem), salvo no celular, igual na Descobrir e no Mapa
- [x] Mapa com pinos agrupados que abrem no zoom
- [x] Boas-vindas na primeira vez (3 telas, interesses e bairro, localização e notificações explicadas)
- [x] Esqueletos, estados vazios com ilustração, puxar pra atualizar em todas as listas
- [x] Vibração leve em "Eu vou", favoritar, curtir e check-in; "Adicionar ao calendário"
- [x] Acessibilidade: contraste, toques de 44 px, descrição nos ícones
- [ ] Liam: rodar `../uairole/supabase/025_holofote_precos.sql` (antes de abrir esta versão)

## 9. Preços dos planos
- [x] Perfil do organizador mostra o plano atual e abre a página Planos do site pra pedir Destaque/Holofote
- [x] `types.ts` e `format.ts` com os tipos dos planos e `formatReais` (iguais ao site)
- [ ] Liam: rodar `../uairole/supabase/026_planos_mensais.sql` (depois do 025)

## 10. Painel no app, pagamentos, ingressos e notificações
- [x] Aba Painel nativa (aparece desde a abertura; "Seja organizador" pra quem ainda não é)
- [x] Locais (endereço vira ponto no mapa), eventos (fotos, preço, idade, ingressos), tipos e lotes, vendas, leitor de QR, estatísticas
- [x] Planos para organizadores (compra no app só se a chave das lojas estiver ligada: REGRAS_DAS_LOJAS.md)
- [x] Conectar Mercado Pago, comprar ingresso (Pix com QR e copia e cola, cartão no Mercado Pago), Meus ingressos com QR
- [x] Perfil só com as coisas da pessoa; Admin e Sócios como "Abrir no computador"; botões que abrem o site avisam
- [x] Preferências de cada tipo de aviso em Privacidade e notificações
- [x] EAS: perfil `development` gera APK pro Android; `app.config.js` liga o Firebase quando o arquivo existir
- [ ] Liam: rodar `../uairole/supabase/027_pagamentos_ingressos.sql` e `028_avisos.sql`
- [ ] Liam: push no Android (development build):
  1. Conta em https://expo.dev, depois `npx eas-cli@latest login` e `npx eas-cli@latest init` nesta pasta
  2. https://console.firebase.google.com → novo projeto → adicionar app Android `com.uairole.app` → baixar
     `google-services.json` e colocar na raiz desta pasta (e fazer commit)
  3. Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada (JSON) →
     `npx eas-cli@latest credentials` → Android → Google Service Account → "FCM V1" → enviar o JSON
  4. `npx eas-cli@latest build --profile development --platform android` → instalar o APK no celular →
     `npx expo start --dev-client`
- [ ] iPhone: precisa do Apple Developer Program (US$ 99/ano, conta de um adulto). Depois: `npx eas-cli@latest device:create`
  e `npx eas-cli@latest build --profile development --platform ios` (o EAS cria a chave de push da Apple sozinho)

## 11. Planos e Painel (correções)
- [x] Planos com os três planos e "Assinar" sempre visível; abre a página de pagamento do site (padrão) ou paga no app (chave em Sócios → Config.)
- [x] Página de pagamento no app (resumo, Pix, crédito, débito) com "chega em breve" + WhatsApp/e-mail quando não estiver liberado
- [x] Cancelar evento: confirmação, série (só esta data / todas), reembolso ou aviso ao admin
- [x] Telas do Painel revisadas pra 320 px e fonte grande; formulário não perde o que foi digitado; locais recarregam
- [ ] Liam: rodar `../uairole/supabase/029_cancelar_evento.sql`
- [ ] Liam: no `.env` do app, `EXPO_PUBLIC_CONTACT_WHATSAPP=55319XXXXXXXX` (opcional)

## 12. Ingressos só com Destaque ou Holofote
- [x] "Vender pelo Uai Rolê" com selo "Destaque ou Holofote"; sem plano fica bloqueado com explicação, "Ver planos" e "Ativar pra este evento"
- [x] Vendas pausadas (plano acabou): aviso no formulário e em Vendas com "Renovar plano"; o "Comprar ingresso" some pro público
- [x] Planos: venda pelo Uai Rolê no Destaque e no Holofote; Grátis fica com o link de ingresso próprio
- [ ] Liam: rodar `../uairole/supabase/030_ingressos_planos.sql` (depois do 029)
