# ADR 0003 — Isolamento total por usuário (Firestore Rules)

**Data:** 2026-08-17
**Status:** Aceito

## Contexto

A LGPD exige que dados pessoais sejam acessíveis **apenas pelo próprio titular** e por pessoas autorizadas. Como a plataforma vai lidar com dados sensíveis de saúde (peso, dores, sono), o isolamento é inegociável.

## Decisão

Adotamos o **padrão Cofrito**: 100% de isolamento por usuário via Firestore Rules. Cada atleta tem `/users/{uid}/...` e só lê/escreve seus próprios dados.

```js
match /users/{uid} {
  allow read, write: if isOwner(uid);

  match /treinos/{treinoId} { allow read, write: if isOwner(uid); }
  match /partidas/{partidaId} { allow read, write: if isOwner(uid); }
  // ... 19 coleções no total
}

function isOwner(uid) {
  return request.auth != null && request.auth.uid == uid;
}
```

## Razões

1. **LGPD art. 18** — titular tem direito de acesso exclusivo
2. **Defesa em profundidade** — mesmo se o front for comprometido, as rules impedem vazamento
3. **Testável** — `firebase emulators:start --only firestore` permite validar cada rule
4. **Sem backend** para validar permissões (reduz superfície de ataque)
5. **Auditável** — regras são código versionado

## Consequências

### Positivas
- **Segurança forte** mesmo com bugs no front
- **Conformidade LGPD** desde o dia 1
- **Sem lógica de permissão** no backend
- **Trivial de auditar** (1 arquivo de rules)

### Negativas
- **Sem cross-user queries** (ex: feed social) sem novo design
- **Admin precisa ser pensado** (papel master)
- **Regras precisam ser testadas** (testes de integração)

### Mitigações
- Padrão de subcoleção por user (evita queries globais)
- `admins/{uid}` com `role: 'master'` para admin
- Testes automatizados em `functions/src/rules/*.test.ts`
