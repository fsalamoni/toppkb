/**
 * Seed user — cria um usuário de teste com dados realistas.
 *
 * Uso:
 *   ts-node scripts/seed-user.ts <email>
 *
 * Cria:
 *   - User doc com perfil do atleta (44a, 95kg, 1.79m)
 *   - 30 dias de treinos
 *   - 10 partidas
 *   - 30 pesos
 *   - 5 dores
 *   - 2 torneios
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential: serviceAccount });
}

const db = admin.firestore();

const PERFIL_BASE = {
  displayName: 'Atleta de Teste',
  pesoInicial: 95,
  pesoMeta: 82,
  altura: 179,
  imcInicial: 29.6,
  objetivoFinal: 'Top 1 do Brasil 50+ em 2032',
  ladoDominante: 'direito',
  parceiroDuplas: 'Pendente',
  consent: true,
  consentAt: admin.firestore.FieldValue.serverTimestamp(),
  onboardingComplete: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoDateNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function seedUser(email: string) {
  // Encontra o user pelo email
  const userRecord = await admin.auth().getUserByEmail(email);
  const uid = userRecord.uid;
  console.log(`🌱 Seeding user ${email} (${uid})...`);

  // Cria user doc
  await db.collection('users').doc(uid).set(PERFIL_BASE, { merge: true });

  // 30 treinos
  console.log('   Criando 30 treinos...');
  const treinosBatch = db.batch();
  for (let i = 0; i < 30; i++) {
    const ref = db.collection('users').doc(uid).collection('treinos').doc();
    treinosBatch.set(ref, {
      data: isoDateNDaysAgo(i),
      tipo: ['duplas', 'simples', 'drills', 'jogo livre'][i % 4],
      duracaoMin: randomInt(60, 180),
      intensidade: randomInt(5, 9),
      rpe: randomInt(5, 9),
      notas: i % 3 === 0 ? 'Foco em footwork e posicionamento' : '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await treinosBatch.commit();

  // 10 partidas
  console.log('   Criando 10 partidas...');
  for (let i = 0; i < 10; i++) {
    const ref = db.collection('users').doc(uid).collection('partidas').doc();
    await ref.set({
      data: isoDateNDaysAgo(i * 3),
      tipo: ['duplas', 'simples'][i % 2],
      resultado: i % 3 === 0 ? 'vitoria' : i % 3 === 1 ? 'derrota' : 'empate',
      placar: `11-${randomInt(5, 9)}`,
      adversario: `Adversário ${i + 1}`,
      parceiro: i % 2 === 0 ? 'João' : '',
      duracaoMin: randomInt(30, 60),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 30 pesos (perda de 0.5kg/semana)
  console.log('   Criando 30 pesos...');
  for (let i = 0; i < 30; i++) {
    const ref = db.collection('users').doc(uid).collection('peso').doc();
    await ref.set({
      data: isoDateNDaysAgo(i),
      peso: 95 - (i * 0.1),
      gorduraCorporal: 25 - (i * 0.1),
      massaMagra: 70,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 5 dores (joelho direito + ombro esquerdo)
  console.log('   Criando 5 dores...');
  const regioes = ['joelho-direito', 'ombro-esquerdo', 'lombar', 'punho-direito', 'tornozelo'];
  for (let i = 0; i < 5; i++) {
    const ref = db.collection('users').doc(uid).collection('dores').doc();
    await ref.set({
      data: isoDateNDaysAgo(i * 5),
      regiao: regioes[i],
      intensidade: randomInt(3, 6),
      duracaoDias: randomInt(1, 3),
      observacoes: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2 torneios (1 passado, 1 futuro)
  console.log('   Criando 2 torneios...');
  await db.collection('users').doc(uid).collection('torneios').add({
    nome: 'Aberto de Inverno',
    dataInicio: isoDateNDaysAgo(30),
    dataFim: isoDateNDaysAgo(28),
    local: 'São Paulo',
    colocacao: 'Quartas',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection('users').doc(uid).collection('torneios').add({
    nome: 'Campeonato Brasileiro 50+',
    dataInicio: isoDateNDaysAgo(-30),
    dataFim: isoDateNDaysAgo(-28),
    local: 'Rio de Janeiro',
    colocacao: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ User ${email} seeded com sucesso`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: ts-node scripts/seed-user.ts <email>');
  process.exit(1);
}

seedUser(args[0])
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌', err); process.exit(1); });
