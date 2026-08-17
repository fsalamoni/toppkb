# 🔒 LGPD e Segurança — Top Pickleball 50+

> Como o app protege os dados do atleta e cumpre a LGPD.

---

## 1. Princípios LGPD aplicados

A LGPD (Lei Geral de Proteção de Dados, Lei 13.709/2018) define 10 princípios. Como o app os cumpre:

| Princípio | Implementação |
|---|---|
| **Finalidade** | Cada registro tem propósito claro (ex: peso = acompanhamento de saúde) |
| **Adequação** | Dados são pertinentes ao objetivo (não coletamos raça, religião, opinião política) |
| **Necessidade** | Coletamos o mínimo (não pedimos CPF, endereço completo, dados financeiros) |
| **Livre acesso** | Usuário exporta todos os dados a qualquer hora |
| **Qualidade dos dados** | Usuário pode corrigir/editar/excluir qualquer registro |
| **Transparência** | Termo de consentimento claro antes do 1º uso |
| **Segurança** | Isolamento total por user + Firestore Rules + criptografia em trânsito |
| **Prevenção** | Rate limit, audit log, CSP, HSTS |
| **Não discriminação** | App não usa dados para qualquer tipo de classificação |
| **Responsabilização** | Audit log + DPO fictício (próprio usuário) |

---

## 2. Dados coletados

### 2.1 Dados obrigatórios (consentidos)
- **Identificação:** e-mail, nome (displayName)
- **Perfil esportivo:** lado dominante, peso, altura, nível, lesões
- **Registros:** treinos, partidas, fisio, nutrição, peso, dores, sono, etc
- **Conversas:** histórico de mensagens com a IA

### 2.2 Dados opcionais
- Cidade/estado
- Parceiro de duplas
- Tempo de jogo, outros esportes
- Foto de perfil

### 2.3 Dados NÃO coletados (deliberadamente)
- CPF, RG, documentos
- Endereço completo
- Dados de pagamento (não há pagamento no MVP)
- Geolocalização em tempo real
- Dados biométricos
- Informações de saúde detalhadas (alergias, medicação contínua — fica no app pessoal do usuário, não no nosso)

---

## 3. Consentimento

### 3.1 Fluxo

1. **1º login** → tela de consentimento obrigatória
2. Checkbox: "Li e aceito os termos"
3. Checkbox: "Entendo que posso exportar e deletar meus dados a qualquer momento"
4. Botão "Aceitar" → registra `consent: { acceptedAt, version, ip }` no user doc

### 3.2 Texto do termo

> **Termo de Consentimento — Top Pickleball 50+**
>
> Seus dados são seus. Sempre.
>
> Este app coleta e processa, com seu consentimento:
> - Dados de identificação (e-mail, nome)
> - Dados esportivos (treinos, partidas, peso, dores)
> - Conversas com a IA
>
> Os dados ficam armazenados no Firebase (Google Cloud Platform), em região sul-americana (southamerica-east1), com criptografia em trânsito (HTTPS/TLS 1.3) e em repouso.
>
> Você pode:
> - 📥 **Exportar** todos os seus dados a qualquer momento
> - 🗑️ **Deletar** sua conta e todos os dados relacionados
> - 📋 **Revisar** este termo a qualquer momento
>
> Não compartilhamos seus dados com terceiros. Não usamos seus dados para publicidade.
>
> Para dúvidas: [contato]

---

## 4. Direitos do titular (LGPD art. 18)

Implementados via endpoints REST e UI:

| Direito | Como exercer | Endpoint |
|---|---|---|
| Acesso | Ver todos os dados no app + exportar | `GET /api/exportar/tudo` |
| Correção | Editar qualquer registro inline | CRUD padrão |
| Eliminação | Deletar conta (remove tudo) | `DELETE /api/deletar-conta` |
| Portabilidade | Exportar JSON | `GET /api/exportar/tudo` |
| Revogação do consent | Deletar conta | `DELETE /api/deletar-conta` |

---

## 5. Implementação técnica da segurança

### 5.1 Autenticação
- **Firebase Auth** com Magic Link (e-mail)
- Sem senha (não há vazamento de credenciais)
- Token JWT verificado em cada request de API
- Token expira em 1h, refresh automático

### 5.2 Autorização (Firestore Rules)
- **Isolamento total por user:** `/users/{uid}/...` só acessível pelo próprio uid
- `isOwner(uid)` em todas as coleções
- `isAdmin()` apenas para corpus/admin-config
- **Sem leitura pública** de nenhum dado

### 5.3 Criptografia
- **Em trânsito:** TLS 1.3 (HSTS habilitado, preload)
- **Em repouso:** criptografia padrão do Firestore (AES-256)
- **API key LLM:** armazenada em `admin-config/llm-secret` (master-only) ou `users/{uid}.llmConfig.apiKey` (owner-only), leitura apenas via Admin SDK. Sistema é provider-agnostic, qualquer um dos 17 provedores é aceito.

### 5.4 Headers de segurança
- `Content-Security-Policy` rigoroso
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 5.5 Rate limiting
- 20 mensagens de chat por minuto
- 60 registros por minuto
- 1 delete de conta por dia
- Implementado em middleware (ver `functions/src/middleware/ratelimit.ts`)

### 5.6 Audit log
- Toda ação crítica (criar/editar/deletar registro, deletar conta, login) gera entrada em `/audit`
- Escrita apenas pelo backend (Admin SDK)
- Retenção: 2 anos

---

## 6. Isolamento por usuário (em detalhe)

Inspirado no padrão Cofrito, com `isOwner(uid)` em todas as collections:

```js
match /users/{uid} {
  allow read, delete: if isOwner(uid);
  allow create: if isOwner(uid) && request.resource.data.keys().hasAll([...]);
  allow update: if isOwner(uid) && isValidUserUpdate();

  // Todas as subcoleções seguem o mesmo padrão
  match /treinos/{treinoId} { allow read, write: if isOwner(uid); }
  match /partidas/{partidaId} { allow read, write: if isOwner(uid); }
  // ... 19 coleções no total
}
```

**Garantia:** mesmo se o front for comprometido, as rules impedem leitura cross-user.

---

## 7. Gestão de incidentes

### 7.1 Plano de resposta

| Cenário | Resposta |
|---|---|
| Vazamento de dados | Notificar usuário em 24h + ANPD em 72h |
| Acesso não autorizado | Revogar tokens + audit + mudar API keys |
| Bug em rules | Rollback + patch + teste de regressão |
| Perda de dados | Restaurar do último backup (GCS) |

### 7.2 Contato para reportar vulnerabilidade

`security@toppickleball50.app` (configure depois do deploy)

---

## 8. Próximo

[`06-API-REFERENCE.md`](./06-API-REFERENCE.md) — contratos das Cloud Functions.
