# 📚 Material de Estudo — Top Pickleball 50+

> Coloque aqui PDFs, textos e referências de pickleball que serão ingeridos pelo corpus.

## Estrutura esperada

```
data/raw/
├── rules/                    # Regras oficiais
│   └── regras-oficiais-pickleball-2024.pdf
├── technique/                # Técnica
│   ├── dink-fundamentals.md
│   ├── third-shot-drop.md
│   └── ...
├── strategy/                 # Estratégia
│   ├── doubles-positioning.md
│   └── ...
├── fitness/                  # Preparação física
│   ├── 50plus-conditioning.pdf
│   └── ...
├── nutrition/                # Nutrição
│   └── anti-inflammatory-diet.md
└── sources.json              # Metadados de cada fonte
```

## Como usar

1. Coloque o material em PDF/MD/TXT nas pastas correspondentes
2. Edite `sources.json` com os metadados (título, autor, ano, URL, tags)
3. Rode `npm run ingest` (em functions/) para vetorizar
4. Os embeddings serão salvos em `corpus/studies/{id}/chunks/`

## Fontes sugeridas

- **PPA (Professional Pickleball Association)** — YouTube channel
- **USA Pickleball** — regras oficiais
- **Pickleball Magazine**
- **Ben Johns, Anna Leigh Waters** — destaques
- **MLP (Major League Pickleball)** — duplas
- **CBP (Confederação Brasileira de Pickleball)** — calendário Brasil
- **Artigos científicos sobre pickleball em 50+**

## Licença

Só inclua material com licença compatível (creative commons, domínio público, ou seu próprio).
