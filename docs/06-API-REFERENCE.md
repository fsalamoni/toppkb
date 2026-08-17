# 📡 API Reference — Top Pickleball 50+

> Contratos das Cloud Functions expostas via `/api/**`.

---

## Convenções

- **Base URL (dev):** `http://localhost:5001/{project}/southamerica-east1/api`
- **Base URL (prod):** `https://toppkb.web.app/api`
- **Auth:** Header `Authorization: Bearer {firebaseIdToken}` (obrigatório exceto `/health`)
- **Content-Type:** `application/json`
- **Rate limit:** 60 req/min (geral), 20 req/min (chat)
- **Códigos de erro:**
  - `400` — payload inválido
  - `401` — sem token / token inválido
  - `403` — consent não aceito / sem permissão
  - `404` — recurso não encontrado
  - `429` — rate limit
  - `500` — erro interno

---

## 1. Auth (público)

### 1.1 `POST /api/auth/send-link`

Envia magic link para o e-mail.

**Body:**
```json
{ "email": "atleta@email.com" }
```

**Response 200:**
```json
{ "ok": true }
```

---

### 1.2 `POST /api/auth/verify`

Verifica o magic link após o usuário clicar.

**Body:**
```json
{ "email": "atleta@email.com", "link": "https://..." }
```

**Response 200:**
```json
{ "uid": "...", "email": "...", "token": "..." }
```

---

### 1.3 `GET /api/health` (público)

**Response 200:**
```json
{ "status": "ok", "version": "0.1.0", "timestamp": "..." }
```

---

## 2. User

### 2.1 `GET /api/user/me`

Retorna o documento do user autenticado.

**Response 200:**
```json
{
  "uid": "...",
  "email": "...",
  "displayName": "...",
  "onboardingComplete": true,
  "ladoDominante": "destro",
  "pesoInicial": 95.0,
  "altura": 179,
  "imcInicial": 29.6,
  "nivelInicial": "iniciante-bom",
  "objetivoFinal": "Top 1 do Brasil 50+ em 2032",
  "prazoMeses": 72,
  "pesoMeta": 80,
  "consent": { "acceptedAt": "...", "version": "1.0" },
  "createdAt": "..."
}
```

---

### 2.2 `PATCH /api/user/me`

Atualiza dados do user (apenas campos permitidos).

**Body:**
```json
{
  "displayName": "Novo Nome",
  "cidade": "São Paulo",
  "estado": "SP",
  "pesoMeta": 78
}
```

---

### 2.3 `POST /api/user/accept-consent`

Registra aceite do consentimento.

**Response 200:**
```json
{ "consent": { "acceptedAt": "...", "version": "1.0" } }
```

---

## 3. Registros (genérico)

Todas as coleções de registro seguem o mesmo padrão. Exemplos:

### 3.1 `POST /api/registros/treinos`

**Body:**
```json
{
  "data": "2026-08-17T19:00:00Z",
  "duracaoMin": 60,
  "tipo": "tecnico",
  "categoria": "pickleball",
  "local": "Clube A",
  "comQuem": "Amigos",
  "intensidade": 7,
  "drillsRealizados": ["dink", "third-shot-drop"],
  "pontuacaoPercebida": 8,
  "rpe": 7,
  "oQueFuncionou": "Dink consistente",
  "oQueMelhorar": "Mais volume no 3rd shot drop",
  "proximoFoco": "Cross-court dink",
  "tags": ["fundamentos"]
}
```

**Response 201:**
```json
{ "id": "treino-uuid", "data": "..." }
```

---

### 3.2 `GET /api/registros/treinos?limit=20&orderBy=data`

**Response 200:**
```json
{
  "items": [ /* Treino[] */ ],
  "total": 87,
  "hasMore": true,
  "nextCursor": "..."
}
```

---

### 3.3 `PUT /api/registros/treinos/{id}`

**Body:** campos parciais para atualizar.

**Response 200:**
```json
{ "id": "treino-uuid", "updatedAt": "..." }
```

---

### 3.4 `DELETE /api/registros/treinos/{id}`

**Response 204:** No content.

---

### Coleções suportadas (mesmo padrão)

- `/api/registros/treinos`
- `/api/registros/partidas`
- `/api/registros/fisio`
- `/api/registros/forca`
- `/api/registros/mobilidade`
- `/api/registros/cardio`
- `/api/registros/refeicoes`
- `/api/registros/agua`
- `/api/registros/suplementos`
- `/api/registros/peso`
- `/api/registros/medidas`
- `/api/registros/sono`
- `/api/registros/dores`
- `/api/registros/avaliacoes`
- `/api/registros/estudos`
- `/api/registros/torneios`
- `/api/registros/metas`

---

## 4. Chat IA

### 4.1 `POST /api/chat/message`

**Body:**
```json
{
  "conversaId": "conv-uuid",   // omitir para criar nova
  "agente": "auto",             // "treinador" | "preparador" | "nutricionista" | "estrategista" | "general" | "auto"
  "mensagem": "Como melhorar meu dink?",
  "contexto": {
    "treinoId": "...",
    "partidaId": "...",
    "pesoId": "..."
  }
}
```

**Response 200:**
```json
{
  "conversaId": "conv-uuid",
  "agenteUsado": "treinador",
  "resposta": "Para melhorar seu dink...",
  "messageId": "msg-uuid",
  "metadata": {
    "tokensUsados": 450,
    "latenciaMs": 2300
  }
}
```

**Rate limit:** 20/min.

---

### 4.2 `GET /api/chat/conversas`

Lista conversas do user.

**Response 200:**
```json
{
  "items": [
    { "id": "conv-uuid", "titulo": "Dink", "agente": "treinador", "updatedAt": "...", "messageCount": 12 }
  ]
}
```

---

### 4.3 `GET /api/chat/conversas/{id}/messages`

**Response 200:**
```json
{
  "items": [
    { "id": "msg-uuid", "role": "user", "content": "...", "createdAt": "..." },
    { "id": "msg-uuid", "role": "assistant", "agente": "treinador", "content": "...", "createdAt": "..." }
  ]
}
```

---

## 5. Métricas

### 5.1 `GET /api/metricas/dashboard`

KPIs principais para o dashboard.

**Response 200:**
```json
{
  "kpis": {
    "pesoAtual": 95.0,
    "pesoDelta7d": -0.3,
    "pesoMeta": 80,
    "imc": 29.6,
    "diasSemDor": 5,
    "sequenciaTreinos": 5,
    "horasTreinoSemana": 8.5,
    "proximoTorneio": {
      "nome": "Open Regional SP",
      "data": "2026-09-15",
      "diasRestantes": 29
    },
    "resumoIA": "Semana forte! Volume subiu 12%..."
  },
  "atualizadoEm": "..."
}
```

---

### 5.2 `GET /api/metricas/peso?dias=90`

Histórico de peso com estatísticas.

**Response 200:**
```json
{
  "pesagens": [
    { "id": "...", "data": "...", "pesoKg": 95.2, "imc": 29.7 }
  ],
  "estatisticas": {
    "minimo": 94.8,
    "maximo": 95.4,
    "media": 95.1,
    "delta": -0.3,
    "projecaoMeses": 50
  }
}
```

---

### 5.3 `GET /api/metricas/resumo-semanal`

Resumo da semana atual (gerado pela IA).

**Response 200:**
```json
{
  "periodo": { "inicio": "2026-08-11", "fim": "2026-08-17" },
  "resumoIA": "Semana forte...",
  "destaques": ["Volume +12%", "Vitória em torneio regional"],
  "alertas": ["Dor no joelho subiu 30%"],
  "sugestoes": ["Reduzir drills de agachamento", "Sessão extra de mobilidade"],
  "metricasChave": {
    "horasTreino": 12.5,
    "horasFisico": 5.0,
    "pesoInicio": 95.3,
    "pesoFim": 95.0,
    "vitorias": 2,
    "derrotas": 1,
    "episodiosDor": 3
  }
}
```

---

## 6. LGPD

### 6.1 `GET /api/exportar/tudo`

Exporta todos os dados do user em JSON.

**Response 200:**
```json
{
  "exportadoEm": "...",
  "user": { ... },
  "perfil": { ... },
  "registros": {
    "treinos": [ ... ],
    "partidas": [ ... ],
    // todas as 19 coleções
  },
  "conversas": [ ... ]
}
```

---

### 6.2 `DELETE /api/deletar-conta`

Deleta conta + todos os dados. **Rate limit: 1x/dia.**

**Response 200:**
```json
{ "ok": true, "deletedAt": "..." }
```

---

## 7. Erros

Todos os erros seguem o formato:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Campo X é obrigatório",
    "details": { "field": "X" }
  }
}
```

| Code | HTTP | Significado |
|---|---|---|
| `unauthorized` | 401 | Token ausente/inválido |
| `forbidden` | 403 | Consent não aceito |
| `not_found` | 404 | Recurso não existe |
| `validation_error` | 400 | Payload inválido |
| `rate_limited` | 429 | Excedeu limite |
| `internal_error` | 500 | Erro inesperado |

---

## Próximo

[`07-AGENTES-PROMPTS.md`](./07-AGENTES-PROMPTS.md) — system prompts dos 5 agentes.
