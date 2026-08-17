/**
 * Script de ingestão — vetoriza material de estudo e salva no Firestore.
 * Uso: cd functions && npm run build && node lib/scripts/ingest.js
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

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

async function vetorizar(texto: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(texto);
  return result.embedding.values;
}

function chunkText(texto: string, maxChars = 1500): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < texto.length) {
    chunks.push(texto.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

async function ingestSource(source: Source) {
  console.log(`[ingest] ${source.id}...`);

  // 1) Salva doc da fonte
  await db.collection('corpus').doc('studies').collection('sources').doc(source.id).set({
    ...source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 2) Lê conteúdo (placeholder — em produção, ler PDF/MD)
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

  // 4) Vetoriza e salva
  const docRef = db.collection('corpus').doc('studies').collection('studies').doc(source.id);
  await docRef.set({
    id: source.id,
    ...source,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await vetorizar(chunk);
    await docRef.collection('chunks').doc(`chunk-${i}`).set({
      content: chunk,
      embedding,
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

  const sources: Source[] = JSON.parse(fs.readFileSync(SOURCES, 'utf-8'));
  for (const s of sources) {
    try {
      await ingestSource(s);
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
