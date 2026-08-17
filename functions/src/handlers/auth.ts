import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { logger } from '../config/env';

/**
 * Trigger: novo user criado via Auth.
 * Cria o doc /users/{uid} e o registro em /admins/{uid} (master se for o primeiro).
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || email.split('@')[0] || 'Atleta';

  logger('auth.onCreate', { uid, email });

  try {
    // Verifica se é o primeiro usuário (vira admin master)
    const adminsSnap = await admin.firestore().collection('admins').limit(1).get();
    const isFirst = adminsSnap.empty;

    // Cria doc do user (com merge para não sobrescrever se já existir)
    await admin.firestore().collection('users').doc(uid).set(
      {
        uid,
        email,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        preferences: { theme: 'dark', language: 'pt-BR', units: 'metric' },
        onboardingComplete: false,
        // consent só é aceito via tela /consent
      },
      { merge: true },
    );

    // Cria registro de admin
    await admin.firestore().collection('admins').doc(uid).set(
      {
        uid,
        email,
        displayName,
        role: isFirst ? 'master' : 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: isFirst ? 'self' : 'master',
      },
      { merge: true },
    );

    // Audit log
    await admin.firestore().collection('audit').add({
      uid,
      acao: 'user.created',
      metadata: { isFirst, email },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e: any) {
    logger('auth.onCreate.error', { uid, message: e.message });
    throw e;
  }
});

/**
 * Trigger: user deletado via Auth.
 * Remove doc /users/{uid} e tudo relacionado.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  logger('auth.onDelete', { uid });

  try {
    // Remove user doc
    await admin.firestore().collection('users').doc(uid).delete();
    // Remove admin
    await admin.firestore().collection('admins').doc(uid).delete().catch(() => {});

    // Audit
    await admin.firestore().collection('audit').add({
      uid,
      acao: 'user.deleted',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e: any) {
    logger('auth.onDelete.error', { uid, message: e.message });
    throw e;
  }
});

/**
 * Trigger: quando o user atualiza lastSeen (heartbeat).
 * Stub — pode ser expandido para analytics.
 */
export const onUserConsent = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before?.consent && after?.consent) {
      logger('user.consent.aceito', { uid: context.params.uid });
      await admin.firestore().collection('audit').add({
        uid: context.params.uid,
        acao: 'consent.aceito',
        metadata: { version: after.consent.version },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
