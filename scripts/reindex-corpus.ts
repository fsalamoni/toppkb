/**
 * Reindex corpus — re-gera embeddings de todos os chunks.
 *
 * Provider-agnostic: usa o provider de embedding configurado pelo admin.
 * Útil quando trocar de modelo/provider de embedding.
 *
 * Uso: ts-node scripts/reindex-corpus.ts
 */

import * as admin from 'firebase-admin';
import { gerarEmbeddings, resolveEmbeddingsConfig } from '../functions/src/services/embeddings';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential: serviceAccount });
}

const db = admin.firestore();
const BATCH_SIZE = 100;

async function reindex() {
  const cfg = await resolveEmbeddingsConfig();
  if (!cfg) {
    console.error('❌ Nenhum provider de embedding configurado.');
    console.error('Configure o admin → LLM Global antes de reindexar.');
    process.exit(1);
  }
  console.log(`🔄 Re-indexando corpus com provider ${cfg.provider} (modelo ${cfg.model}, ${cfg.dimensions} dims)...`);

  const studiesSnap = await db
    .collection('corpus').doc('studies').collection('studies')
    .get();
  console.log(`   ${studiesSnap.size} documentos a processar`);

  let totalChunks = 0;
  let totalProcessed = 0;

  for (const studyDoc of studiesSnap.docs) {
    const chunksSnap = await studyDoc.ref.collection('chunks').get();
    if (chunksSnap.empty) continue;

    console.log(`\n   📄 ${studyDoc.id}: ${chunksSnap.size} chunks`);
    totalChunks += chunksSnap.size;

    for (let i = 0; i < chunksSnap.docs.length; i += BATCH_SIZE) {
      const slice = chunksSnap.docs.slice(i, i + BATCH_SIZE);
      const contents = slice.map((d) => d.data().content);
      const embeddings = await gerarEmbeddings(contents);

      const batch = db.batch();
      slice.forEach((chunkDoc, j) => {
        batch.update(chunkDoc.ref, {
          embedding: admin.firestore.FieldValue.vector(embeddings[j]),
        });
      });
      await batch.commit();
      totalProcessed += slice.length;
      console.log(`     ${totalProcessed}/${totalChunks} processados`);
    }
  }

  console.log(`\n✅ Re-indexação completa: ${totalProcessed} chunks`);
}

reindex()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌', err); process.exit(1); });
