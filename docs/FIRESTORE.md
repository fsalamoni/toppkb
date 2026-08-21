# Firestore — Isolamento e estrutura de dados

O Firestore é **compartilhado** com outras plataformas (Cofrito, SIGO/CAOCIPP…).
Este app é **totalmente isolado**: só lê/escreve sob o prefixo `toppkb_`. Nunca
toca em coleções de outras plataformas e nunca é afetado por elas.

## Como o isolamento é garantido (duas camadas)

1. **Cliente (frontend)** → protegido pelas **Security Rules** (`firestore.rules`).
   Regra padrão: `allow read, write: if false`. Só caminhos `toppkb_*` são
   liberados. Como o SDK do navegador respeita as regras, o frontend é
   fisicamente incapaz de acessar dados de outra plataforma.

2. **Backend (Cloud Functions)** → o Admin SDK **ignora** as regras, então o
   isolamento é feito em código, na camada `functions/src/config/db-namespace.ts`:
   - `db` (de `config/env.ts`) e `getFirestore()` (de `services/firestore.ts`)
     são **embrulhados** para que toda raiz de `db.collection(x)` / `db.doc('x/…')`
     seja remapeada para o caminho canônico `toppkb_*`.
   - Qualquer raiz desconhecida é **prefixada por segurança** (`toppkb_<raiz>`),
     então nenhuma escrita "escapa" do namespace, mesmo em código futuro.
   - Consultas `collectionGroup(...)` cruzam namespaces por natureza; por isso os
     resultados são filtrados com `filterToppkbDocs(...)` (mantém só paths
     `toppkb_`).
   - Testes: `functions/src/config/db-namespace.test.ts`.

## Estrutura canônica (todas as raízes começam com `toppkb_`)

```
toppkb_users/{uid}                         # doc raiz do usuário (llmConfig, role, prefs…)
  profile/main                             # perfil do atleta (consent, onboarding, peso, altura…)
  treinos/{id}  partidas/{id}  preparacao/{id}
  nutricao/{id}  nutricao_agua/{id}  nutricao_suplementos/{id}
  sono/{id}  peso/{id}  medidas/{id}  dores/{id}  lesoes/{id}
  torneios/{id}  metas/{id}  estudos/{id}  hidratacao/{id}  agregados/{id}
  chat/{convId}                            # conversa (titulo, agente, updatedAt…)
    mensagens/{msgId}                      # mensagens do chat (role, content, createdAt)

toppkb_admin/admins/{uid}                  # registro de admin (role, active)
toppkb_admin/config/{llm|llm-secret|agents}# configs de LLM/agentes (admin)
toppkb_admin/audit_logs/logs/{id}          # auditoria

toppkb_corpus/studies/{studies|sources}/{id}
  .../chunks/{id}                          # embeddings do RAG
toppkb_agents_config/{id}                  # config pública de agentes
toppkb_seed/{collection}/{id}              # dados semente (read-only)
toppkb_tournaments_public/{id}             # torneios públicos
toppkb_analytics/{id}                      # eventos de analytics (backend)
toppkb_system/{id}                         # agregados/estado do sistema (backend)
```

## Regra de ouro para novo código

- **Frontend**: use sempre `toppkb_users/{uid}/…` (ou os helpers em
  `frontend/src/lib/firestore-paths.ts`). As regras rejeitam qualquer outra raiz.
- **Backend**: use `db`/`getFirestore()` normalmente — o namespacing é
  automático. Ao usar `collectionGroup(...)`, **sempre** passe os resultados por
  `filterToppkbDocs(...)`.
