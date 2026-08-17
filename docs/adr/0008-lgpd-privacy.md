# ADR 0008 — Privacidade e LGPD

## Status

Aceito (2025-01-15)

## Contexto

Aplicação brasileira que processa dados pessoais sensíveis (peso, lesões, hábitos alimentares). Sujeita à LGPD (Lei Geral de Proteção de Dados).

Precisamos garantir:
- Consentimento explícito
- Isolamento total por usuário
- Direito ao esquecimento (delete)
- Direito de acesso (export)
- PII filter antes de enviar a serviços externos (LLM)
- Audit log de ações sensíveis

## Decisão

Adotar o conjunto de práticas abaixo como padrão:

### 1. Consentimento explícito

- Campo `consent: boolean` no user doc
- Trigger `onUserConsent` registra timestamp e IP
- Sem consentimento → API retorna 403

### 2. Isolamento por usuário (Firestore Rules)

Todas as subcoleções sob `users/{uid}/` validam:
```
allow read, write: if isOwner(uid);
```
Onde `isOwner(uid) = request.auth.uid == uid`.

### 3. Direito ao esquecimento

- Callable `deleteAccount` remove:
  - Todas as subcoleções (treinos, partidas, etc)
  - User doc
  - Admin doc
  - Auth user (Firebase Auth)
- Audit log registra a ação (sem dados sensíveis)
- Rate limit: 1 delete por dia

### 4. Direito de acesso

- Callable `exportAllData` retorna JSON com:
  - Perfil
  - Todos os registros (todas as coleções)
  - Conversas + mensagens
  - Metadados (consent, createdAt, lastSeen)

### 5. PII filter (anonymizer)

Antes de enviar ao LLM, o `anonymizer` substitui:
- E-mails → `[EMAIL]`
- CPFs → `[CPF]`
- CNPJs → `[CNPJ]`
- Telefones → `[PHONE]`
- Cartões de crédito → `[CARD]`

**Limitação**: filtro "best effort". Para uso em produção com dados sensíveis, revisão humana é recomendada.

### 6. apiKey masking

- `apiKey` nunca é retornada ao frontend (sempre `sk-1••••cdef`)
- Frontend recebe `keyMasked` apenas
- Regras: `admin-config/llm-secret` é master-only

### 7. Audit log

Coleção `audit` registra:
- `conta.deletada`
- `feedback.saved`
- `admin.document.deleted`
- `admin.granted` / `admin.revoked`
- Eventos sensíveis

## Consequências

**Positivas:**
- Conformidade com LGPD
- Privacidade por design
- Confiança do usuário (auditoria transparente)
- Risco jurídico baixo

**Negativas:**
- Mais código (consent, export, delete, anonymizer)
- Custo de Firestore (audit log cresce)
- Latência adicional do PII filter (~5-20ms)

## Compliance

- LGPD Art. 7 (consentimento) ✓
- LGPD Art. 18 (acesso, correção, eliminação) ✓
- LGPD Art. 46 (segurança) ✓
- LGPD Art. 48 (notificação de incidente) — usar Sentry/PagerDuty
