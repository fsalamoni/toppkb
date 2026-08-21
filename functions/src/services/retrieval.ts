/**
 * Retrieval — busca semântica no corpus.
 *
 * Provider-agnostic: usa o provider de embedding configurado pelo admin/user.
 * Se ninguém configurou, retorna [] silenciosamente.
 *
 * Pipeline:
 *  1. Gera embedding da query (via embeddings.ts)
 *  2. Busca por similaridade cosseno (Firestore Vector Search nativo OU in-memory)
 *  3. Retorna top-K chunks com metadados
 */

import { db } from '../config/env';
import { filterToppkbDocs } from '../config/db-namespace';
import { gerarEmbedding, cosineSimilarity, resolveEmbeddingsConfig } from './embeddings';
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
  sourceTypes?: string[];
  topics?: string[];
  uid?: string; // uid do user — usado para resolver config de embeddings
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
    // 0) Verifica se há provider de embedding configurado
    const embCfg = await resolveEmbeddingsConfig(options.uid);
    if (!embCfg) {
      logger.warn('retrieval.noEmbeddingsConfig', {
        message: 'Nenhum provider de embedding configurado. RAG desabilitado.',
      });
      return [];
    }

    // 1) Gera embedding da query usando o provider configurado
    const queryEmbedding = await gerarEmbedding(query, options.uid);

    // 2) Busca todos os chunks (só os deste app — collectionGroup cruza namespaces)
    const chunksSnap = await db.collectionGroup('chunks').get();
    const chunkDocs = filterToppkbDocs(chunksSnap.docs);
    if (chunkDocs.length === 0) return [];

    // 3) Calcula similaridade in-memory (compatível com qualquer dimensão)
    const candidates: RetrievedChunk[] = [];
    for (const doc of chunkDocs) {
      const data = doc.data();
      const embedding = data.embedding as number[] | undefined;
      if (!embedding) continue;
      // Verifica dimensão: chunks indexados com a MESMA dimensão da config atual
      if (embedding.length !== queryEmbedding.length) continue;

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
