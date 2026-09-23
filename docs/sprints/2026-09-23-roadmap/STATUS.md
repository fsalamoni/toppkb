# STATUS — Top Pickleball 50+ — 23/09/2026

**Roadmap:** [00-ROADMAP-PRINCIPAL.md](./00-ROADMAP-PRINCIPAL.md)

## Sprint atual: **SPRINT 64** (auditoria e padronização de profundidade)

## Progresso

### ✅ Sprint 64.1 — `scripts/audit_exercicios.py` criado
- Analisa 89 exercícios automaticamente
- Calcula score 0-100 baseado em 14 critérios
- Gera AUDIT-EXERCICIOS-2026-09-23.md

### ✅ Sprint 64.2 — Auditoria rodada
- **Score médio: 80.4/100** (era 71.9 antes do fix do regex)
- **89/89 exercícios** analisados
- **49/89 (55%)** acima de 80
- **4/89 (4%)** perfeitos (>=95): swing-2h-hardstyle, swing-1h, deadlift, swing-sport
- **40/89 (45%)** abaixo de 80 — precisam melhorar
- AUDIT-EXERCICIOS-2026-09-23.md gerado em `docs/sprints/2026-09-23-roadmap/`

### 🔄 Sprint 64.3 — Reescrever exercícios com score < 80
- Tarefa em andamento
- 40 exercícios identificados
- Prioridade: padrões com mais exercícios fracos:
  - **COND**: 17 exercícios, score médio 76.4 (mais fraco)
  - **CARRY**: 8 exercícios, score médio 77.8
  - **PULL**: 9 exercícios, score médio 79.8
  - **ROT**: 11 exercícios, score médio 79.4

### ⏳ Sprint 64.4 — Validar score >= 80 em todos
- Pendente

## Próximos sprints

- **Sprint 65**: Validação cruzada nos 15 pontos de exposição
- **Sprint 66**: Anatomia nas imagens PNG (silhueta)
- **Sprint 67**: Anatomia detalhada nos avatares SVG
- **Sprint 68**: Vídeos demonstrativos (avatares animados)
- **Sprint 69**: Validação de usuário (5-10 exercícios como leigo)
- **Sprint 70**: Revisão linguística (glossário leigo)
- **Sprint 71**: OndeSentir visual (anatomia clicável)
- **Sprint 72**: Cache de imagens/vídeos (PWA offline)
- **Sprint 73**: Métricas de uso (analytics)
- **Sprint 74**: Documentação final

## Bugs corrigidos nesta sessão

### 🐛 `scripts/audit_exercicios.py`
- **Problema:** `extract_steps` pegava `step_body` apenas até o primeiro `],` (após as cues), perdendo as `sensacoes` e `alertasMusculares` que vinham depois.
- **Fix:** Para o último step (sem próximo `{ numero:`), usar `rest[:1500]` para pegar todo o conteúdo até o fim do objeto.
- **Impacto:** Score médio subiu de 71.9 → 80.4, revelando 49 exercícios já bons (eram 0 acima de 80).
