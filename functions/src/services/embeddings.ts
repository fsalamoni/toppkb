/**
 * Embeddings service — gera embeddings com Gemini text-embedding-004.
 *
 * Tamanho: 768 dimensões.
 * Custo: grátis (até 1500 req/min no plano free).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let client: GoogleGenerativeAI | null = null;
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
    client = new GoogleGenerativeAI(apiKey);
    model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  }
  return model;
}

/**
 * Gera embedding de um texto.
 */
export async function gerarEmbedding(texto: string): Promise<number[]> {
  const m = getModel();
  const result = await m.embedContent(texto);
  return result.embedding.values;
}

/**
 * Gera embeddings de vários textos em batch.
 * Gemini não tem batch nativo, mas limita rate de chamadas paralelas.
 */
export async function gerarEmbeddings(textos: string[]): Promise<number[][]> {
  const BATCH = 10;
  const out: number[][] = [];
  for (let i = 0; i < textos.length; i += BATCH) {
    const slice = textos.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((t) => gerarEmbedding(t)));
    out.push(...results);
    if (i + BATCH < textos.length) {
      // Pequena pausa para não estourar rate limit
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return out;
}

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIM,
};

/**
 * Calcula similaridade cosseno entre dois vetores.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
