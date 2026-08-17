/**
 * Retrieval — busca semântica no corpus (Firestore Vector Search + fallback).
 *
 * Pipeline:
 *  1. Gera embedding da query
 *  2. Busca por similaridade cosseno (Firestore Vector Search nativo OU in-memory)
 *  3. Retorna top-K chunks com metadados
 */

import { db } from '../config/env';
import { gerarEmbedding, cosineSimilarity, EMBEDDING_CONFIG } from './embeddings';
import { logger } from 'firebase-functions';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    topico?: string;
    subtopico?: string;
    tipo?: string;
  };
  searchKeywords: string[];
  score: number;
}

export interface RetrievalOptions {
  topK?: number;
  minSimilarity?: number;
  sourceTypes?: string[]; // filtro por tipo (pdf, video, artigo)
  topics?: string[]; // filtro por tópico
}

const DEFAULT_TOP_K = 8;
const DEFAULT_MIN_SIMILARITY = 0.55;

export async function retrieveRelevantChunks(
  query: string,
  options: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const minSim = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;

  try {
    // 1) Gera embedding da query
    const queryEmbedding = await gerarEmbedding(query);

    // 2) Tenta Firestore Vector Search nativo (se disponível)
    const chunksSnap = await db.collectionGroup('chunks').get();

    // 3) Calcula similaridade in-memory (fallback robusto)
    const candidates: RetrievedChunk[] = [];
    for (const doc of chunksSnap.docs) {
      const data = doc.data();
      const embedding = data.embedding as number[] | undefined;
      if (!embedding || embedding.length !== EMBEDDING_CONFIG.dimensions) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);
      if (score < minSim) continue;

      candidates.push({
        id: doc.id,
        documentId: data.documentId || doc.ref.parent.parent?.id || '',
        content: data.content || '',
        metadata: data.metadata || {},
        searchKeywords: data.searchKeywords || [],
        score,
      });
    }

    // 4) Ordena e pega top-K
    candidates.sort((a, b) => b.score - a.score);

    // 5) Aplica filtros
    let filtered = candidates.slice(0, topK * 2);
    if (options.sourceTypes && options.sourceTypes.length > 0) {
      filtered = filtered.filter((c) => options.sourceTypes!.includes(c.metadata.tipo || ''));
    }
    if (options.topics && options.topics.length > 0) {
      filtered = filtered.filter((c) =>
        c.searchKeywords.some((k) => options.topics!.some((t) => k.includes(t))),
      );
    }

    return filtered.slice(0, topK);
  } catch (e: any) {
    logger.warn('retrieval.error', { message: e.message });
    return [];
  }
}
