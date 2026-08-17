# ADR 0005 — Autenticação via Magic Link (sem senha)

**Data:** 2026-08-17
**Status:** Aceito

## Contexto

O app precisa de autenticação segura e simples. O atleta (44 anos) pode não querer gerenciar mais uma senha.

## Decisão

Adotamos **Firebase Auth com Magic Link por e-mail** (passwordless).

### Fluxo
1. Usuário digita e-mail
2. Firebase envia link para o e-mail
3. Usuário clica no link
4. Firebase autentica e cria ID Token
5. Frontend recebe o token, persiste (localStorage)
6. Todas as requisições enviam `Authorization: Bearer {token}`

## Razões

1. **Sem senha** — não há vazamento de credenciais
2. **Sem OAuth** — não depende de Google/Facebook/Apple
3. **Baixa fricção** — único passo (e-mail)
4. **LGPD-friendly** — sem armazenar hash de senha
5. **Gratuito** no Firebase Auth
6. **Idêntico ao Cofrito** — mesmo padrão

## Consequências

### Positivas
- **UX simples** — atleta não cria senha
- **Sem "esqueci a senha"** — fluxo de recuperação é o próprio magic link
- **Sem vazamento** — Firebase não armazena senhas
- **Múltiplos dispositivos** — cada device pede seu próprio link

### Negativas
- **Depende de e-mail** — se e-mail cair em spam, usuário fica travado
- **Ataque de phishing** — link pode ser confundido com phishing (mitigado com branding)
- **Sem 2FA** nativo (mas magic link é 2FA de fato: algo que você tem + algo que você sabe)

### Mitigações
- E-mail de transação com template claro (branding Top Pickleball 50+)
- SPF/DKIM/DMARC configurados no domínio
- Rate limit no envio (5 magic links/hora por e-mail)
- Expiração do link em 1 hora
