import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { logger } from '../config/env';
import { assertUid, userDoc, globalCol, globalDoc } from '../config/namespace';

/**
 * Trigger: novo user criado via Auth.
 * Cria doc em toppkb_users/{uid} e toppkb_admin/admins/{uid} (master se for o primeiro).
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || email.split('@')[0] || 'Atleta';
  assertUid(uid, 'onUserCreated');

  logger('auth.onCreate', { uid, email });

  try {
    // Verifica se é o primeiro usuário (vira admin master)
    const adminsSnap = await admin
      .firestore().collection(globalCol('admin')).doc('admins').collection('admins')
      .limit(1).get();
    const isFirst = adminsSnap.empty;

    // Cria doc do user no namespace toppkb_
    await admin.firestore().doc(userDoc(uid)).set(
      {
        uid,
        email,
        displayName,
        photoURL: user.photoURL || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        preferences: { theme: 'dark', language: 'pt-BR', units: 'metric' },
        onboardingComplete: false,
        consent: false,
        role: isFirst ? 'master' : 'user',
      },
      { merge: true },
    );

    // Cria registro de admin
    await admin.firestore().doc(globalDoc('admin', `admins/${uid}`)).set(
      {
        uid,
        email,
        displayName,
        role: isFirst ? 'master' : 'admin',
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: isFirst ? 'self' : 'master',
      },
      { merge: true },
    );

    // Audit log (namespace toppkb_admin/audit_logs/logs)
    await admin.firestore()
      .collection(globalCol('admin')).doc('audit_logs').collection('logs')
      .add({
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
 * Remove doc em toppkb_users/{uid} e tudo relacionado.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  assertUid(uid, 'onUserDeleted');
  logger('auth.onDelete', { uid });

  try {
    // Remove user doc
    await admin.firestore().doc(userDoc(uid)).delete().catch(() => {});

    // Remove admin
    await admin.firestore().doc(globalDoc('admin', `admins/${uid}`)).delete().catch(() => {});

    // Audit
    await admin.firestore()
      .collection(globalCol('admin')).doc('audit_logs').collection('logs')
      .add({
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
 * Trigger: quando o user dá consent (LGPD).
 * Cria audit log. Escuta em toppkb_users/{uid}.
 */
export const onUserConsent = functions.firestore
  .document('toppkb_users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid as string;
    assertUid(uid, 'onUserConsent');

    if (!before?.consent && after?.consent) {
      logger('user.consent.aceito', { uid });
      await admin.firestore()
        .collection(globalCol('admin')).doc('audit_logs').collection('logs')
        .add({
          uid,
          acao: 'consent.aceito',
          metadata: { version: after.consent?.version || '1.0' },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });
