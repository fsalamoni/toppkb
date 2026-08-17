/**
 * Validate corpus — verifica integridade do corpus indexado.
 *
 * Verifica:
 *   - Documentos sem chunks
 *   - Chunks sem embedding
 *   - Embeddings com dimensão errada
 *   - Status stale (sem updatedAt)
 *
 * Uso: ts-node scripts/validate-corpus.ts
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential: serviceAccount });
}

const db = admin.firestore();
const EXPECTED_DIMS = 768;

async function validate() {
  console.log('🔍 Validando corpus...');

  const studiesSnap = await db
    .collection('corpus').doc('studies').collection('studies')
    .get();

  console.log(`   ${studiesSnap.size} documentos encontrados`);

  let totalChunks = 0;
  let chunksSemEmbedding = 0;
  let embeddingsErrados = 0;
  let docsSemChunks = 0;
  let staleCount = 0;
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 30);

  for (const studyDoc of studiesSnap.docs) {
    const data = studyDoc.data();
    if (!data.chunkCount) {
      docsSemChunks++;
    }
    if (data.updatedAt && data.updatedAt.toDate() < staleDate) {
      staleCount++;
    }

    const chunksSnap = await studyDoc.ref.collection('chunks').get();
    if (chunksSnap.empty) {
      docsSemChunks++;
      continue;
    }

    totalChunks += chunksSnap.size;
    for (const chunkDoc of chunksSnap.docs) {
      const cData = chunkDoc.data();
      if (!cData.embedding) {
        chunksSemEmbedding++;
      } else if (cData.embedding.length !== EXPECTED_DIMS) {
        embeddingsErrados++;
      }
    }
  }

  console.log('\n📊 Relatório:');
  console.log(`   Total documentos:        ${studiesSnap.size}`);
  console.log(`   Total chunks:            ${totalChunks}`);
  console.log(`   Documentos sem chunks:   ${docsSemChunks} ${docsSemChunks > 0 ? '⚠️' : '✅'}`);
  console.log(`   Chunks sem embedding:    ${chunksSemEmbedding} ${chunksSemEmbedding > 0 ? '⚠️' : '✅'}`);
  console.log(`   Embeddings dimensão !=${EXPECTED_DIMS}: ${embeddingsErrados} ${embeddingsErrados > 0 ? '⚠️' : '✅'}`);
  console.log(`   Docs stale (>30d):       ${staleCount} ${staleCount > 0 ? '⚠️' : '✅'}`);

  if (chunksSemEmbedding > 0 || embeddingsErrados > 0 || docsSemChunks > 0) {
    console.log('\n❌ Corpus com problemas. Considere re-indexar.');
    process.exit(1);
  } else {
    console.log('\n✅ Corpus íntegro!');
    process.exit(0);
  }
}

validate().catch((err) => { console.error('❌', err); process.exit(1); });
