/**
 * Script de seed para popular dados de demonstração do Top Pickleball 50+.
 *
 * USO:
 *   1. Logue-se no app e copie seu UID (visível no Firestore Console)
 *   2. Edite a constante SEED_UID abaixo com o seu UID
 *   3. Rode: node scripts/seed-demo.mjs
 *
 * IMPORTANTE: este script lê credenciais via Application Default Credentials
 * (gcloud auth application-default login) OU usa a FIREBASE_SERVICE_ACCOUNT do GitHub.
 *
 * Em ambiente local, configure:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *
 * Ou use o emulador:
 *   export FIRESTORE_EMULATOR_HOST=localhost:8080
 *   node scripts/seed-demo.mjs
 */

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

// =============== CONFIG ===============
const SEED_UID = process.env.SEED_UID || 'SEU_UID_AQUI';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'antonov-82411';

// =============== INIT ===============
let app;
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // Emulator
  app = initializeApp({ projectId: PROJECT_ID });
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  console.log(`[seed] Conectando ao emulador: ${process.env.FIRESTORE_EMULATOR_HOST}`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  // Service account file
  const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
  app = initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  console.log(`[seed] Conectando como service account: ${sa.client_email}`);
} else {
  app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  console.log(`[seed] Conectando com Application Default Credentials`);
}

const db = getFirestore(app);
const NS = 'toppkb_users';

// =============== SEED ===============
async function seedTreinos() {
  console.log('[seed] Criando 5 treinos (últimos 30 dias)...');
  const treinos = [
    { diasAtras: 1, tipo: 'quadra', categoria: 'intenso', duracaoMin: 90, intensidade: 8, rpe: 8, energia: 7, humor: 8, local: 'Clube A', comQuem: 'parceiro', drills: ['dink', 'drop', 'terceira-bola'], observacoes: 'Sessão tática boa' },
    { diasAtras: 3, tipo: 'fisico', categoria: 'moderado', duracaoMin: 60, intensidade: 6, rpe: 7, energia: 7, humor: 7, local: 'Academia', drills: [], observacoes: 'Funcional + mobilidade' },
    { diasAtras: 5, tipo: 'tecnico', categoria: 'intenso', duracaoMin: 75, intensidade: 7, rpe: 7, energia: 8, humor: 8, local: 'Quadra coberta', drills: ['saque', 'retorno', 'transicao'], observacoes: 'Foco em devolução' },
    { diasAtras: 8, tipo: 'parede', categoria: 'leve', duracaoMin: 45, intensidade: 5, rpe: 5, energia: 6, humor: 7, local: 'Casa', drills: ['dink-parede'], observacoes: 'Praticar dink sozinho' },
    { diasAtras: 12, tipo: 'quadra', categoria: 'muito-intenso', duracaoMin: 120, intensidade: 9, rpe: 9, energia: 6, humor: 6, local: 'Torneio interno', comQuem: 'dupla parceira', drills: [], observacoes: 'Torneio do clube — 4 jogos' },
  ];
  const col = db.collection(`${NS}/${SEED_UID}/treinos`);
  for (const t of treinos) {
    const data = new Date(Date.now() - t.diasAtras * 24 * 60 * 60 * 1000).toISOString();
    await col.add({
      uid: SEED_UID,
      data,
      tipo: t.tipo,
      categoria: t.categoria,
      duracaoMin: t.duracaoMin,
      intensidade: t.intensidade,
      rpe: t.rpe,
      energia: t.energia,
      humor: t.humor,
      local: t.local,
      comQuem: t.comQuem,
      drills: t.drills,
      observacoes: t.observacoes,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${treinos.length} treinos`);
}

async function seedPartidas() {
  console.log('[seed] Criando 6 partidas...');
  const partidas = [
    { diasAtras: 2, resultado: 'vitoria', placar: '11-8 11-9', tipo: 'duplas', local: 'Clube A', modalidade: 'duplas', duracaoMin: 50, setsVencidos: 2, setsPerdidos: 0, winners: 12, unforcedErrors: 4, parceiroDupla: 'João', adversario1: 'Carlos', adversario2: 'Mário' },
    { diasAtras: 4, resultado: 'derrota', placar: '9-11 11-8 8-11', tipo: 'duplas', local: 'Clube A', modalidade: 'duplas', duracaoMin: 70, setsVencidos: 1, setsPerdidos: 2, winners: 8, unforcedErrors: 7, parceiroDupla: 'João', adversario1: 'Pedro', adversario2: 'Lucas' },
    { diasAtras: 6, resultado: 'vitoria', placar: '11-5 11-7', tipo: 'simples', local: 'Clube B', modalidade: 'simples', duracaoMin: 35, setsVencidos: 2, setsPerdidos: 0, winners: 18, unforcedErrors: 2, adversario1: 'Roberto' },
    { diasAtras: 9, resultado: 'vitoria', placar: '11-9 9-11 11-6', tipo: 'duplas', local: 'Clube A', modalidade: 'duplas', duracaoMin: 60, setsVencidos: 2, setsPerdidos: 1, winners: 15, unforcedErrors: 5, parceiroDupla: 'João', adversario1: 'Ana', adversario2: 'Bruno' },
    { diasAtras: 12, resultado: 'vitoria', placar: '11-7 11-4 11-8', tipo: 'torneio', local: 'Torneio', modalidade: 'simples', duracaoMin: 45, setsVencidos: 3, setsPerdidos: 0, winners: 25, unforcedErrors: 3 },
    { diasAtras: 14, resultado: 'derrota', placar: '11-8 5-11 7-11', tipo: 'duplas', local: 'Clube A', modalidade: 'duplas', duracaoMin: 55, setsVencidos: 1, setsPerdidos: 2, winners: 10, unforcedErrors: 8, parceiroDupla: 'João', adversario1: 'Marcos', adversario2: 'Rui' },
  ];
  const col = db.collection(`${NS}/${SEED_UID}/partidas`);
  for (const p of partidas) {
    const data = new Date(Date.now() - p.diasAtras * 24 * 60 * 60 * 1000).toISOString();
    await col.add({
      uid: SEED_UID,
      data,
      resultado: p.resultado,
      placar: p.placar,
      tipo: p.tipo,
      local: p.local,
      modalidade: p.modalidade,
      duracaoMin: p.duracaoMin,
      setsVencidos: p.setsVencidos,
      setsPerdidos: p.setsPerdidos,
      winners: p.winners,
      unforcedErrors: p.unforcedErrors,
      parceiroDupla: p.parceiroDupla,
      adversario1: p.adversario1,
      adversario2: p.adversario2,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${partidas.length} partidas`);
}

async function seedPeso() {
  console.log('[seed] Criando 8 pesagens (últimos 60 dias)...');
  const col = db.collection(`${NS}/${SEED_UID}/peso`);
  const pesos = [82.3, 82.0, 81.5, 81.2, 80.8, 80.5, 80.1, 79.8];
  for (let i = 0; i < pesos.length; i++) {
    const diasAtras = (pesos.length - 1 - i) * 7;
    const data = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await col.add({
      uid: SEED_UID,
      data,
      peso: pesos[i],
      gorduraPercent: 22 - i * 0.3,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${pesos.length} pesagens`);
}

async function seedSono() {
  console.log('[seed] Criando 7 registros de sono (últimos 7 dias)...');
  const col = db.collection(`${NS}/${SEED_UID}/sono`);
  const horas = [7.5, 6.5, 8, 7, 6, 8.5, 7.5];
  const qualidades = [4, 3, 5, 3, 2, 5, 4];
  for (let i = 0; i < horas.length; i++) {
    const diasAtras = horas.length - 1 - i;
    const data = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await col.add({
      uid: SEED_UID,
      data,
      horaDormir: '23:00',
      horaAcordar: '06:30',
      horasDormidas: horas[i],
      qualidade: qualidades[i],
      fatores: qualidades[i] >= 4 ? [] : ['estresse'],
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${horas.length} registros de sono`);
}

async function seedHidratacao() {
  console.log('[seed] Criando 5 registros de hidratação...');
  const col = db.collection(`${NS}/${SEED_UID}/hidratacao`);
  const hoje = new Date().toISOString().slice(0, 10);
  await col.add({
    uid: SEED_UID,
    data: hoje,
    totalMl: 1850,
    coposPequenos: 2,
    coposMedios: 1,
    coposGrandes: 3,
    observacoes: 'Dia quente',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✓ 1 registro de hoje`);
}

async function seedTorneios() {
  console.log('[seed] Criando 2 torneios...');
  const col = db.collection(`${NS}/${SEED_UID}/torneios`);
  await col.add({
    uid: SEED_UID,
    nome: 'Open de Inverno 50+',
    dataInicio: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    dataFim: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'estadual',
    categoria: '50+',
    modalidade: 'duplas',
    local: 'Clube Tênis',
    cidade: 'Porto Alegre',
    estado: 'RS',
    status: 'agendado',
    createdAt: FieldValue.serverTimestamp(),
  });
  await col.add({
    uid: SEED_UID,
    nome: 'Copa Brasil 50+',
    dataInicio: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    dataFim: new Date(Date.now() + 92 * 24 * 60 * 60 * 1000).toISOString(),
    tipo: 'nacional',
    categoria: '50+',
    modalidade: 'simples',
    local: 'Clube Marapendi',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    status: 'agendado',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✓ 2 torneios`);
}

async function seedMetas() {
  console.log('[seed] Criando 3 metas...');
  const col = db.collection(`${NS}/${SEED_UID}/metas`);
  const metas = [
    { titulo: 'Top 5 do ranking estadual 50+', categoria: 'competitiva', prazo: 12, prazoMeses: 12, progresso: 35, status: 'ativa' },
    { titulo: 'Aumentar força de pegada em 20%', categoria: 'fisica', prazo: 6, prazoMeses: 6, progresso: 60, status: 'ativa' },
    { titulo: 'Participar de 4 torneios em 2026', categoria: 'competitiva', prazo: 10, prazoMeses: 10, progresso: 50, status: 'ativa' },
  ];
  for (const m of metas) {
    await col.add({
      uid: SEED_UID,
      ...m,
      prazo: new Date(Date.now() + m.prazo * 30 * 24 * 60 * 60 * 1000).toISOString(),
      descricao: '',
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${metas.length} metas`);
}

async function seedProfile() {
  console.log('[seed] Criando profile...');
  await db.doc(`${NS}/${SEED_UID}/profile/main`).set({
    uid: SEED_UID,
    email: 'demo@toppkb.app',
    displayName: 'Atleta Demo',
    role: 'user',
    pesoInicial: 82.3,
    pesoMeta: 78,
    altura: 178,
    idade: 50,
    consent: true,
    onboardingComplete: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('  ✓ profile');
}

async function main() {
  if (SEED_UID === 'SEU_UID_AQUI') {
    console.error('❌ Defina SEED_UID antes de rodar (use a env var ou edite o script)');
    process.exit(1);
  }
  console.log(`\n[seed] Populando dados para UID: ${SEED_UID}\n`);
  await seedProfile();
  await seedTreinos();
  await seedPartidas();
  await seedPeso();
  await seedSono();
  await seedHidratacao();
  await seedTorneios();
  await seedMetas();
  console.log('\n✅ Seed completo!\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
