# ADR 0007 — Firestore Vector Search

## Status

Aceito (2025-01-15)

## Contexto

Para fazer RAG (Retrieval Augmented Generation) eficiente, precisamos de:
- Busca semântica (por similaridade de embedding)
- Latência < 200ms (para chat em tempo real)
- Sem custo de infraestrutura extra
- Até ~10k chunks (estimativa para Fase 1)

Alternativas consideradas:

1. **Algolia / Pinecone / Weaviate**: serviço externo, custo mensal, latência variável
2. **Vertex AI Matching Engine**: poderoso mas caro (min. ~$50/mês)
3. **Postgres + pgvector**: precisaria de Postgres, mais infra
4. **Firestore Vector Search**: nativo no Firestore, sem custo extra
5. **Calcular cosine similarity in-memory**: simples mas não escala

## Decisão

Usar **Firestore Vector Search** nativo (GA desde maio 2024).

- Embeddings gerados com `text-embedding-004` (768 dims)
- Indexado via `db.collection().findNearest('embedding', queryVector, { limit, distanceMeasure: 'COSINE' })`
- Storage: `corpus/studies/studies/{id}/chunks/{position}` com `embedding` field

## Consequências

**Positivas:**
- Zero infra extra (já temos Firestore)
- Latência < 100ms para 10k chunks
- Custo de embedding depende do provider escolhido (Ollama é grátis, outros variam)
- Queries unificadas com Firestore Security Rules

**Negativas:**
- Limite de 768 dims (resolvido escolhendo modelo certo)
- Ainda em GA mas com rápida evolução
- Limitado a ~1M vetores por index (suficiente para Fase 1)
- Sem filtros pré-pipeline complexos (mas COSINE é o que queremos)

## Quando migrar

Se atingirmos 100k+ chunks ou se a latência subir > 500ms, considerar migrar para Vertex AI Matching Engine.
