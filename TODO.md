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
- [ ] Liam: criar conta na Expo, rodar `npx eas-cli@latest init` (gera o projectId) e `eas build --profile development`

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
