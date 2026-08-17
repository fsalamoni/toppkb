/**
 * Admin documents — gerencia documentos do corpus (admin only).
 *
 * Endpoints:
 *  - adminListDocuments: lista todos os documentos (com paginação)
 *  - adminGetDocument: detalhes de um documento
 *  - adminDeleteDocument: remove um documento
 *  - adminGetStats: estatísticas do corpus
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/env';
import { assertAdmin } from '../middleware/auth';

export const adminListDocuments = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);

    const { status, limit = 20, cursor, classification } = request.data as {
      status?: string;
      limit?: number;
      cursor?: string;
      classification?: string;
    };

    let q: FirebaseFirestore.Query = db
      .collection('corpus').doc('studies').collection('studies')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 100));

    if (status) q = q.where('status', '==', status);
    if (classification) q = q.where('classification.natureza', '==', classification);
    if (cursor) {
      const cursorSnap = await db
        .collection('corpus').doc('studies').collection('studies')
        .doc(cursor).get();
      q = q.startAfter(cursorSnap);
    }

    const snap = await q.get();
    return {
      items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      hasMore: snap.docs.length === limit,
      nextCursor: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null,
    };
  },
);

export const adminGetDocument = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);
    const { documentId } = request.data as { documentId: string };
    if (!documentId) throw new HttpsError('invalid-argument', 'documentId obrigatório');

    const docRef = db.collection('corpus').doc('studies').collection('studies').doc(documentId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new HttpsError('not-found', 'Documento não encontrado');

    const chunksSnap = await docRef.collection('chunks').orderBy('position', 'asc').get();
    return {
      id: docSnap.id,
      ...docSnap.data(),
      chunks: chunksSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  },
);

export const adminDeleteDocument = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);
    const { documentId } = request.data as { documentId: string };
    if (!documentId) throw new HttpsError('invalid-argument', 'documentId obrigatório');

    const docRef = db.collection('corpus').doc('studies').collection('studies').doc(documentId);

    // Deleta chunks
    const chunks = await docRef.collection('chunks').get();
    const batch = db.batch();
    chunks.docs.forEach((c) => batch.delete(c.ref));
    batch.delete(docRef);
    await batch.commit();

    // Audit
    await db.collection('audit').add({
      uid: request.auth.uid,
      acao: 'admin.document.deleted',
      metadata: { documentId },
      timestamp: new Date(),
    });

    return { ok: true };
  },
);

export const adminGetStats = onCall(
  { cors: true, enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Faça login.');
    await assertAdmin(request.auth.uid);

    const [docs, chunks, sources, users] = await Promise.all([
      db.collection('corpus').doc('studies').collection('studies').get(),
      db.collectionGroup('chunks').get(),
      db.collection('corpus').doc('studies').collection('sources').get(),
      db.collection('users').get(),
    ]);

    // Agrupa por status
    const byStatus: Record<string, number> = {};
    const byClassification: Record<string, number> = {};
    for (const doc of docs.docs) {
      const data = doc.data();
      const status = data.status || 'sem_status';
      byStatus[status] = (byStatus[status] || 0) + 1;
      if (data.classification?.natureza) {
        const nat = data.classification.natureza;
        byClassification[nat] = (byClassification[nat] || 0) + 1;
      }
    }

    return {
      documents: docs.size,
      chunks: chunks.size,
      sources: sources.size,
      users: users.size,
      byStatus,
      byClassification,
    };
  },
);
