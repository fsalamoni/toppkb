# Guia do Criador de Conteúdo — Como adicionar exercícios KB

**Data:** 2026-09-23
**Sprint:** 74.2
**Público:** Você ou futuros colaboradores que quiserem adicionar exercícios novos

## Estrutura dos arquivos

O seed dos exercícios fica em:
```
frontend/src/data/seed/exercicios-kettlebell.ts
```

Cada exercício é um objeto dentro do array `KETTLEBELL_EXERCICIOS`.

## Schema obrigatório (campos não-negociáveis)

```typescript
{
  id: 'kb-<slug-kebab>',                    // OBRIGATÓRIO. Único. Ex: 'kb-swing-2h-hardstyle'
  nome: 'Nome do Exercício',                  // OBRIGATÓRIO. Title Case
  grupo: 'categoria-do-grupo',                 // OBRIGATÓRIO. core/pernas/bracos/ombros
  padraoMovimento: 'tipo-de-movimento',       // OBRIGATÓRIO. ex: 'rotacao', 'extensao'
  padraoKb: 'KB-PATTERN',                     // OBRIGATÓRIO. 1 dos 8: HINGE/SQUAT/PRESS/PULL/CARRY/ROT/COND/FLOW
  equipamento: 'kettlebell',                  // OBRIGATÓRIO
  nivel: 'inici | inter | avanc',             // OBRIGATÓRIO
  focoPrincipal: 'Descrição curta do foco',    // OBRIGATÓRIO. <50 chars
  musculosSecundarios: ['Musc1', 'Musc2'],    // OBRIGATÓRIO. min 2 itens
  descricao: 'Descrição completa >= 80 chars',// OBRIGATÓRIO
  dicas: ['Dica 1', 'Dica 2', 'Dica 3'],       // OBRIGATÓRIO. 3-7 itens
  cues: ['Cue 1', 'Cue 2'],                   // OBRIGATÓRIO. 3-7 itens
  errors: ['Erro comum 1', ...],              // OBRIGATÓRIO. 3-7 itens
  alerta50mais: '⚠️ 50+: ...',                // OBRIGATÓRIO. >= 80 chars, menciona 50+ específico
  contraIndicacoes: ['Cond1', 'Cond2', ...],  // OBRIGATÓRIO. 3-6 itens
  evidencia: 'Citação (Autor Ano): ...',      // OBRIGATÓRIO
  referencias: ['StrongFirst', 'PubMed ID'],  // OBRIGATÓRIO. 2-5 fontes
  videoUrl: vid('<mp4-name>.mp4'),            // OBRIGATÓRIO
  imageUrl: img('<jpg-name>.jpg'),            // OBRIGATÓRIO. Capa
  thumbnailUrl: img('<jpg-name>.jpg'),        // OBRIGATÓRIO
  galleryImages: [...],                       // OBRIGATÓRIO. etapas visuais
  sources: [...],                             // OBRIGATÓRIO. Fontes Wikimedia/PubMed
  fontFamily: 'Source 1 | Source 2',          // OBRIGATÓRIO. Origem do conhecimento

  // === Específicos KB (não-negociáveis para o padrão de qualidade) ===
  mapaMuscularLeigo: [                        // OBRIGATÓRIO. 4-17 itens
    'Glúteo máximo (bumbum) — drive principal',
    'Isquiotibial (parte de trás da coxa) — alonga',
    // etc
  ],
  sensacaoPrincipal: 'Onde sentir...',         // OBRIGATÓRIO. Linguagem leiga
  erroMuscular: 'Sintoma → Causa',             // OBRIGATÓRIO. Sintoma → causa
  analogiaInicial: 'Imagine que...',           // OBRIGATÓRIO. Metáfora do cotidiano
  cargaInicial50mais: 'X kg (sexo). 50+...',   // OBRIGATÓRIO

  steps: [                                    // OBRIGATÓRIO. 4-7 steps
    {
      numero: 1,
      titulo: 'Setup inicial',                 // OBRIGATÓRIO. < 50 chars
      descricao: 'Descrição >= 80 chars',      // OBRIGATÓRIO
      duracaoSeg: 10,                          // OBRIGATÓRIO.
      cues: ['Cue1', 'Cue2', 'Cue3'],          // OBRIGATÓRIO. 2-5
      sensacoes: [                             // OBRIGATÓRIO. 2-6
        'Glúteo trabalhando',
        'Calcanhar firme',
        // etc, cada um com verbos de sensação
      ],
      alertasMusculares: [                     // OBRIGATÓRIO. 1-4
        'Se quadril falhar: pare',
        // etc
      ],
      imagem: { src: img('step-images/...'), alt: '...', caption: '...' }
    },
    // ...
  ],

  fontFamily: 'Family 1 | Family 2',
  fontesExternas: [
    { name: 'Wikipedia - ...', url: 'https://...', license: 'CC BY-SA' },
  ],
}
```

## Padrão de Qualidade Sprint 64.3+

Cada exercício precisa **OBRIGATORIAMENTE** ter:

1. **mapaMuscularLeigo** com 5+ itens usando linguagem leiga:
   - ✅ "Glúteo máximo (bumbum)" → "Bumbum"
   - ❌ "Glúteo (gluteus maximus)"

2. **Steps com profundidade**:
   - **2+ sensações** por step (com verbos: "trabalhando", "alongando", "contraindo", "esticando")
   - **1+ alerta muscular** por step
   - **3+ cues** por step (curtos e imperativos: "Quadril para trás", "Pés firmes")
   - **descricao >= 80 chars** por step

3. **Campos 50+ específicos**:
   - `alerta50mais` (>= 80 chars, menciona 50+)
   - `cargaInicial50mais` (formato: "X-Y kg (mulher/homem). 50+: ...")
   - `contraIndicacoes` (3-6 itens específicos)

4. **Base científica**:
   - `evidencia` com citação real (Autor Ano: ...)
   - `referencias` com pelo menos 1 PubMed/StrongFirst

5. **Acessibilidade pedagógica**:
   - `analogiaInicial` com metáfora do cotidiano
   - `erroMuscular` no formato "sintoma → causa"

## Passo a passo para adicionar um novo exercício

### 1. Adicione o objeto no array `KETTLEBELL_EXERCICIOS`

Abra `frontend/src/data/seed/exercicios-kettlebell.ts`. Localize o array e adicione seu objeto respeitando a posição alfabética pelos padrões KB (ex: HINGE após os outros HINGEs).

### 2. Crie o `videoUrl` (apontando para MP4)

Verifique se o MP4 existe em `frontend/public/kettlebell/videos/`. Se não existir:
- Crie o MP4 (ou peça ao admin master)
- OU aponte `videoUrl` para um MP4 similar existente

### 3. Gere as imagens PNG didáticas

Execute:
```bash
python3 scripts/regen_step_images.py
```

Isso lê o seed e gera PNGs em `frontend/public/kettlebell/step-images/<exercise>-step-<n>.png` com **silhueta humana + músculo destacado**.

### 4. Gere os avatares SVG com anatomia

Execute:
```bash
python3 scripts/regen_avatars.py
```

Gera SVGs em `frontend/public/kettlebell/avatars/<exercise>-step-<n>.svg` com articulações, KB com alça, ângulos.

### 5. Gere os SVGs animados (SMIL)

Execute:
```bash
python3 scripts/gen_step_animations.py
```

Gera SVGs animados em `frontend/public/kettlebell/step-anim/<exercise>-step-<n>.svg`.

### 6. Valide com o auditor automático

Execute:
```bash
python3 scripts/audit_exercicios.py
```

Vai gerar/atualizar `docs/sprints/2026-09-23-roadmap/AUDIT-EXERCICIOS-2026-09-23.md` com score do exercício novo.

Score mínimo aceitável: **80**. Ideal: **>= 95**.

### 7. Preencha `contraIndicacoes` e `alerta50mais`

Se o auditor mostrar que esses campos estão faltando, execute:
```bash
python3 scripts/fill_missing_fields.py
```

(Esse script só preenche campos faltantes com base no padrão KB.)

### 8. Valide typecheck e build

```bash
cd frontend
npm run typecheck   # 0 erros
npm run build       # build OK
```

### 9. Commit + push

```bash
git add .
git -c http.sslVerify=false commit -m "feat(seed): adicionar <nome-do-exercicio>"
git -c http.sslVerify=false push origin main
```

Deploy é **automático** via GitHub Actions.

## Convenções de nomenclatura

- **id**: `kb-<slug-kebab>`, ex: `kb-waiter-walk`, `kb-single-leg-rdl`
- **nome**: Title Case, ex: "Waiter Walk", "Single-Leg RDL"
- **slug nas imagens**: mesmo que o id (sem prefixo kb-)

## Quando usar jargão técnico

- **Primeira menção**: "Glúteo máximo (bumbum)"
- **Repetições**: "bumbum" (leigo)
- **Em evidência científica**: mantenha o termo técnico

## Recursos para criar exercícios novos

| Recurso | URL | Tipo |
|---------|-----|------|
| StrongFirst | https://www.strongfirst.com/ | Treino KB |
| PubMed | https://pubmed.ncbi.nlm.nih.gov/ | Pesquisa científica |
| Wikipedia | https://en.wikipedia.org/wiki/Kettlebell_exercise | Conceitos |
| Onnit Academy | https://www.onnit.com/academy/ | Artigos |
| Stronger Therapist Podcast | https://www.strongfix.com/ | Conteúdo 50+ |

---

**Próximo:** Sprint 74.3 (AUDITORIA-FINAL.md)
