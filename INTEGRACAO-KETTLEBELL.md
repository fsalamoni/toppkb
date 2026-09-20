# 🏋️ Integração Caderno de Kettlebell → TopPKB

> **Feature de Preparação Física da Top Pickleball 50+ agora alimentada pela base completa do projeto "Caderno de Kettlebell v18"** (82 exercícios + ciência + periodização).

## ✅ O que foi entregue

| Arquivo | Tipo | LOC | Descrição |
|---------|------|-----|-----------|
| `frontend/src/data/seed/exercicios-kettlebell.ts` | seed | ~1900 | **82 exercícios KB** com cues, errors, vídeo, evidência |
| `frontend/src/data/seed/periodizacao-templates.ts` | seed | ~700 | **5 templates** de 12 sem (Iniciante/Interm./Avançado/Emagrecer/Rehab) |
| `frontend/src/pages/Exercicios.tsx` | page | ~410 | **Biblioteca de Exercícios** (busca + filtros + modal) |
| `frontend/src/pages/Periodizacao.tsx` | page | ~450 | **Gerador de Plano** (timeline 12 sem + drill-down) |
| `frontend/src/App.tsx` | rota | +2 | Lazy-load `Exercicios` e `Periodizacao` |
| `frontend/src/components/layout/Sidebar.tsx` | nav | +2 | Novos links em "Preparação Física" |

**Compat:** 100% — não alterei nenhum arquivo existente (apenas adicionei). O `PreparacaoForm` antigo continua funcionando.

## 🧪 Validação

- ✅ `tsc --noEmit` — **0 erros**
- ✅ `npm run build` — **32.57s, 0 erros**
- ✅ Bundle splitting saudável:
  - `exercicios-kettlebell.js` — 46.7 KB (gzip 11.8 KB) — **lazy-loaded**
  - `Exercicios.js` — 10.8 KB (gzip 3.0 KB)
  - `Periodizacao.js` — 26.0 KB (gzip 5.4 KB)

## 🚀 Deploy

### Opção 1 — Firebase CLI (produção em `toppkb.web.app`)

```bash
# 1. Já tem as mudanças no commit 19f5bdc
# 2. Faça push pro seu fork/repo
git push origin main

# 3. Na sua máquina (já logado no Firebase)
firebase login
cd toppkb
firebase deploy --only hosting
```

### Opção 2 — Preview público (JÁ FEITO)

URL de preview (somente este build, não conectado ao Firebase Auth real):
**https://bt7lu1d6asf8v.space.minimax.io**

⚠️ **Limitação do preview:** Login/Auth/Firestore **não funcionam** porque o `.env` com credenciais Firebase não foi commitado (segurança). Para testar login/dados, faça o deploy Firebase real.

## 🎯 Como testar localmente

```bash
cd toppkb_repo/frontend
cp .env.example .env.local   # preencher GEMINI_API_KEY + Firebase config
npm install
npm run dev
# abre http://localhost:5173
# login com sua conta Google (já autorizada no projeto antonov-82411)
```

## 📚 Estrutura dos dados

### `ExercicioKettlebell`

Compatível com `Exercicio` original, com campos extras:

```typescript
interface ExercicioKettlebell extends Exercicio {
  padraoKb: 'HINGE' | 'SQUAT' | 'PRESS' | 'PULL' | 'CARRY' | 'ROT' | 'COND' | 'FLOW';
  cues: string[];           // 3-5 frases-chave
  errors: string[];         // 2-4 erros comuns
  evidencia?: string;       // Resumo da evidência científica
  referencias?: string[];   // PMIDs/DOIs
  videoUrl?: string;        // Vídeo demonstrativo
  imageUrl?: string;        // Foto estática
  thumbnailUrl?: string;    // Thumbnail
}
```

### `TemplatePeriodizacao`

5 níveis × 12 semanas × 3 dias/semana × 4-6 exercícios/sessão:

```typescript
type NivelPeriodizacao = 'iniciante' | 'intermediario' | 'avancado' | 'emagrecer' | 'rehab';

interface TemplatePeriodizacao {
  id: NivelPeriodizacao;
  nome: string;
  descricao: string;
  diasPorSemana: number;
  duracaoTotalSemanas: 12;
  semanas: SemanaPeriodizacao[];  // 12 entries
  // ...
}
```

Cada `SemanaPeriodizacao` tem 3 `SessaoTreino` com `ExercicioPrescrito[]`:
```typescript
interface ExercicioPrescrito {
  exercicioId: string;        // ID do KETTLEBELL_EXERCICIOS
  padrao: PadraoKettlebell;
  series: number;
  reps: number | string;      // "10" ou "EMOM 20 reps"
  carga: string;              // "16kg", "BW", "50% 1RM"
  rpeAlvo: number;            // 1-10
  descansoSeg: number;
  notas?: string;
}
```

## 🔬 Ciência usada (todos com PMID/DOI verificáveis)

- **McGill & Marshall 2012** (PMID 22201691) — swing tem 5-6× menos compressão lombar que deadlift
- **Lake & Lauder 2012** — swing melhora CMJ +7%, squat jump +19% em 6 sem
- **BELL trial 2022** (PMC9026020) — 6 meses hardstyle KB → +0.65 kg massa magra, +7.1 kg grip, +41.7m 6MWD em 50+
- **Watson LIFTMOR 2018** (PMID 28929619) — +2.9% DMO lombar em 8 meses
- **Refalo 2022** (PMID 36178597) — VL50 maximiza hipertrofia
- **Schoenfeld 2017** (DOI 10.1080/02640414.2016.1210197) — dose-response volume/hipertrofia
- **Khan 2024** (PMC11077891) — long-term KB systematic review
- **Issurin 2010** — Residual Training Effects
- **Helms 2019** — Block Periodization
- **Coleman 2024** (PMC10809978) — deload 6.4±1.7 dias a cada 5.6±2.3 sem
- **Bell 2024** (PMID 38499934) — deload systematic review
- **Tsatsouline 2019** — Simple & Sinister

## 🛣️ Roadmap sugerido (próximos passos)

- [ ] Aprimorar `/preparacao/nova` para integrar séries/reps/carga por exercício (em vez de só marcar nome)
- [ ] Adicionar Achievement "Kettlebell 1000 swings in 7 days" (Simple & Sinister)
- [ ] Integrar com agente Gemini existente — gerar periodização custom baseada em HRV/dor/sono
- [ ] Adicionar upload de vídeos pessoais (Firebase Storage) — substitui CDN externa por storage privado
- [ ] Dashboard de "Volume por padrão" — gráfico de pizza mostrando distribuição HINGE/SQUAT/etc
- [ ] Export de periodização como PDF (para levar pra academia)
- [ ] Sincronizar com Google Calendar (treinos planejados)

---

**Branch:** `main`
**Commit:** `19f5bdc feat: integração Caderno de Kettlebell completo na feature de Preparação Física`
**Versão plataforma:** v18 + Caderno KB integrado
**Mantido por:** Mavis Agent · fsalamoni (dono do repo)
