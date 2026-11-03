# Uai Rolê — App de celular

## O que é
App nativo (iPhone e Android) do Uai Rolê, feito com Expo. É o mesmo Uai Rolê do site
(`../uairole`): mesmo banco Supabase, mesmas regras, mesmo visual. O site continua sendo
o lugar do Painel do organizador, do Admin e de Sócios e finanças.

## Como vamos trabalhar
- O Liam (15 anos, dono do projeto) dá as ideias e você constrói uma de cada vez.
- Construa direto, sem pedir aprovação. Só pare se precisar de algo do Liam, se ele
  precisar rodar SQL, ou se der um erro que você não consiga resolver.
- Se uma ideia tiver um problema (segurança, custo, algo que vai quebrar), avise e sugira
  uma alternativa, mas a decisão final é do Liam.
- Explique tudo em português, de forma simples e curta.
- Depois de cada parte funcionando: `npm run typecheck`, `npm run lint` e commit no Git.
- Ao terminar algo, diga como testar no Expo Go (ou no development build, se for push).
- Leia o `AGENTS.md` (regras da Expo): o Expo muda muito a cada versão, então confira a
  documentação da versão certa antes de usar uma API.

## Stack (não trocar sem perguntar)
- Expo SDK 58, React Native, TypeScript, Expo Router (rotas em `src/app/`)
- Supabase (`@supabase/supabase-js`), o MESMO projeto do site
- Mapa: `react-native-maps` (funciona no Expo Go)
- Localização `expo-location`, fotos `expo-image-picker` + `expo-image-manipulator`,
  push `expo-notifications`, navegador `expo-web-browser`
- Fontes iguais às do site: Geist (texto) e Bricolage Grotesque (títulos)
- Ícones: só `lucide-react-native` (componente `Icon` em `src/components/icons.tsx`, traço 2),
  desenhos com `react-native-svg`. Sem emojis na interface (emojis digitados pelos usuários aparecem).
- Calendário: `expo-calendar/legacy` (abre a tela do próprio celular; funciona no Expo Go)
- Sempre instale com `npx expo install <pacote>` (escolhe a versão certa pro SDK).
- Antes de instalar uma biblioteca nova, diga qual e por quê.

## Banco de dados
- NÃO mude tabelas existentes. O RLS é o mesmo do site, então todas as regras de idade,
  privacidade e segurança valem aqui automaticamente.
- Se precisar de algo novo no banco: arquivo SQL numerado continuando a numeração do site,
  dentro de `../uairole/supabase/` (o último é `026_planos_mensais.sql`).
- Já existem dados reais: toda mudança mantém e converte os dados, nunca apaga.
- Teste o SQL antes com `npm run test:banco` no site e avise o Liam qual arquivo rodar no
  SQL Editor do Supabase.

## Regras que valem sempre
- Chaves no `.env` (fica no `.gitignore`): só a URL e a chave **publishable**. Nunca a chave
  secreta no app (tudo que é `EXPO_PUBLIC_` vai dentro do app).
- Sessão salva com segurança: criptografada (AES) com a chave no cofre do celular
  (`src/lib/supabase.ts`).
- Login, cadastro e "esqueci a senha" só com código de 6 dígitos por e-mail (sem links).
- Classificação etária (Livre, 16+, 18+): quem decide é o banco. Visitante e conta sem data
  de nascimento veem só Livre. Nada de promoção de bebida alcoólica para menores.
- Localização: só na hora (check-in e "minha localização"), nunca guardada.
- Push e avisos respeitam a idade de quem recebe (feito no banco, no `023`).

## Onde fica cada coisa
- `src/app/(tabs)/` — barra de baixo: Descobrir (`index`), Mapa, Feed, Favoritos, Perfil
- `src/app/` — evento, local, organizador, pessoa, post, login/cadastro/código, amigos,
  privacidade, avisos
- `src/components/` — peças visuais (`ui.tsx` tem botão, chip, campo, avisos, Sheet)
- `src/lib/` — dados e regras. `types.ts`, `format.ts`, `profanity.ts`, `filters.ts`,
  `illustrations.ts` e `calendar.ts` são cópias do site: se mudar lá, mude aqui também.
- `src/lib/use-filters.ts` — filtros salvos no aparelho (AsyncStorage); a localização fica só na memória.
- `src/components/filters/` — painel de filtros (barra de preço com duas bolinhas, calendário).
- `src/components/onboarding.tsx` — boas-vindas na primeira vez que abre o app.
- `src/lib/links.ts` — abre links do site no app (push e avisos); o que não existe no app
  abre no navegador.

## Visual
- Escuro, rosa-choque (#ff2e88) com gradiente no Holofote, igual ao site. Cores em `src/lib/theme.ts`.
- Botão com texto branco usa `C.accentStrong` (#e0177a) por contraste. Toque mínimo de 44 px (`TOUCH`).
- Planos: Grátis, Destaque e Holofote (antes chamado "Rolê da noite").
- Português do Brasil, com um toque mineiro leve ("uai", "sô", "rolê").

## Testar
- `npx expo start` e ler o QR code com o app Expo Go (celular e computador na mesma rede).
- Push só funciona no development build (`eas build --profile development`), não no Expo Go.
