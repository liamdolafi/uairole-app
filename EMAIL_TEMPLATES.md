# Modelos de e-mail do Supabase (código de 6 dígitos)

O app só usa **código** (link no celular dá problema). O Supabase só deixa editar os modelos
depois de configurar um **SMTP próprio** (Authentication → Emails → SMTP Settings — dá pra
usar Resend, Brevo, etc., com plano grátis).

Os modelos abaixo mandam o **código e o link juntos**: o app usa o código e o site continua
funcionando com o link enquanto `NEXT_PUBLIC_AUTH_EMAIL_CODE` não for ligado lá.

Onde colar: Supabase → Authentication → Emails → Templates.

## Confirm signup
Assunto: `Seu código do Uai Rolê: {{ .Token }}`

```html
<h2>Bem-vindo ao Uai Rolê! 🎉</h2>
<p>Seu código de confirmação é:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Digite esse código no app. Ele vale por 1 hora.</p>
<p>Tá no computador? Também dá pra <a href="{{ .ConfirmationURL }}">confirmar pelo link</a>.</p>
<p>Se não foi você, pode ignorar este e-mail.</p>
```

## Reset password
Assunto: `Código pra trocar sua senha: {{ .Token }}`

```html
<h2>Trocar a senha do Uai Rolê</h2>
<p>Seu código é:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Digite esse código no app pra criar uma senha nova. Ele vale por 1 hora.</p>
<p>No computador? <a href="{{ .ConfirmationURL }}">Trocar pelo link</a>.</p>
<p>Se não foi você, pode ignorar este e-mail.</p>
```

Confira também em Authentication → Providers → Email que o tamanho do código (Email OTP Length)
está em **6**.
