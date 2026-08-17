/**
 * Reindex corpus — re-gera embeddings de todos os chunks.
 *
 * Útil quando trocar de modelo de embedding.
 *
 * Uso: ts-node scripts/reindex-corpus.ts
 */

import * as admin from 'firebase-admin';
import { embedTexts, EMBEDDING_CONFIG } from '../functions/src/services/embeddings';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential: serviceAccount });
}

const db = admin.firestore();
const BATCH_SIZE = 100;

async function reindex() {
  console.log(`🔄 Re-indexando corpus com modelo ${EMBEDDING_CONFIG.model}...`);

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
      const embeddings = await embedTexts(contents);

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
