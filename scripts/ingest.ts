/**
 * Script de ingestão — vetoriza material de estudo e salva no Firestore.
 *
 * Provider-AGNOSTIC: usa o provider de embedding configurado pelo admin.
 * Se nada estiver configurado, aborta com mensagem clara.
 *
 * Uso: cd functions && npm run build && node lib/scripts/ingest.js
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { gerarEmbeddings, resolveEmbeddingsConfig } from '../services/embeddings';

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const ROOT = path.resolve(__dirname, '../../data/raw');
const SOURCES = path.join(ROOT, 'sources.json');

interface Source {
  id: string;
  titulo: string;
  fonte: string;
  tipo: string;
  url?: string;
  tags: string[];
  idioma: string;
  ano: number;
}

function chunkText(texto: string, maxChars = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < texto.length) {
    chunks.push(texto.slice(i, i + maxChars));
    i += maxChars - overlap;
  }
  return chunks;
}

async function ingestSource(source: Source, embProvider: string, embModel: string, embDims: number) {
  console.log(`[ingest] ${source.id} (${embProvider}/${embModel}, ${embDims} dims)...`);

  // 1) Salva doc da fonte
  await db.collection('corpus').doc('studies').collection('sources').doc(source.id).set({
    ...source,
    embeddingProvider: embProvider,
    embeddingModel: embModel,
    embeddingDimensions: embDims,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2) Lê conteúdo
  const conteudoPath = path.join(ROOT, 'rules', `${source.id}.md`);
  let conteudo = '';
  if (fs.existsSync(conteudoPath)) {
    conteudo = fs.readFileSync(conteudoPath, 'utf-8');
  } else {
    console.warn(`[ingest] conteúdo não encontrado para ${source.id} em ${conteudoPath}`);
    return;
  }

  // 3) Chunks
  const chunks = chunkText(conteudo);
  console.log(`  → ${chunks.length} chunks`);

  // 4) Vetoriza (em batch) e salva
  const docRef = db.collection('corpus').doc('studies').collection('studies').doc(source.id);
  await docRef.set({
    id: source.id,
    ...source,
    embeddingProvider: embProvider,
    embeddingModel: embModel,
    embeddingDimensions: embDims,
    chunkCount: chunks.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const embeddings = await gerarEmbeddings(chunks);
  for (let i = 0; i < chunks.length; i++) {
    await docRef.collection('chunks').doc(`chunk-${i.toString().padStart(4, '0')}`).set({
      content: chunks[i],
      embedding: admin.firestore.FieldValue.vector(embeddings[i]),
      position: i,
      metadata: { topico: source.tags[0] || 'geral' },
      searchKeywords: source.tags,
    });
  }
}

async function main() {
  if (!fs.existsSync(SOURCES)) {
    console.error(`[ingest] ${SOURCES} não encontrado`);
    process.exit(1);
  }

  // Verifica config de embeddings do admin
  const cfg = await resolveEmbeddingsConfig();
  if (!cfg) {
    console.error('❌ Nenhum provider de embedding configurado.');
    console.error('Configure o admin master em Admin → LLM Global antes de rodar este script.');
    process.exit(1);
  }

  const sources: Source[] = JSON.parse(fs.readFileSync(SOURCES, 'utf-8'));
  for (const s of sources) {
    try {
      await ingestSource(s, cfg.provider, cfg.model, cfg.dimensions);
    } catch (e: any) {
      console.error(`[ingest] erro em ${s.id}: ${e.message}`);
    }
  }

  console.log('[ingest] done');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
