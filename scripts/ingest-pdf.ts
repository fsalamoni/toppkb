/**
 * Ingest PDF — pipeline completo de ingestão.
 *
 * Uso:
 *   ts-node scripts/ingest-pdf.ts <caminho-do-pdf>
 *
 * Etapas:
 *   1. Extrai texto do PDF (pdf-parse)
 *   2. Divide em chunks (1500 chars com overlap 200)
 *   3. Gera embeddings (Gemini text-embedding-004)
 *   4. Salva no corpus (corpus/studies/studies/{id})
 *   5. Salva chunks no subcollection (chunks/{position})
 *   6. Indexa para vector search (Firestore Vector)
 *
 * Requer:
 *   - GEMINI_API_KEY no .env (ou admin-config/llm-secret)
 *   - Firebase Admin SDK credenciais
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { chunkText } from '../functions/src/services/chunking';
import { embedTexts, EMBEDDING_CONFIG } from '../functions/src/services/embeddings';

// Init Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : admin.credential.applicationDefault();
  admin.initializeApp({ credential: serviceAccount });
}

const db = admin.firestore();

async function extractPdfText(pdfPath: string): Promise<string> {
  // pdf-parse é CJS, usar require dinâmico
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function classifyAndEmenta(text: string): Promise<any> {
  // Por simplicidade, faz chamada HTTP ao Gemini para classificar
  // (em produção seria via PipelineAgent)
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'Você classifica documentos de pickleball. Responda APENAS JSON válido.',
  });

  const prompt = `Classifique o documento abaixo. Responda JSON com: { natureza, tipoDocumento, areaDireito, assuntos (array), areas (array), topicos (array), conclusao (resumo 1 frase), keywords (array de 5-10 termos) }.

DOCUMENTO:
${text.slice(0, 4000)}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta não é JSON');
  return JSON.parse(jsonMatch[0]);
}

async function ingest(pdfPath: string) {
  console.log(`📄 Lendo PDF: ${pdfPath}`);
  const fileName = path.basename(pdfPath);
  const text = await extractPdfText(pdfPath);
  console.log(`   Texto extraído: ${text.length} chars`);

  console.log('🔍 Classificando...');
  const ementa = await classifyAndEmenta(text);
  console.log(`   Natureza: ${ementa.natureza}, Tipo: ${ementa.tipoDocumento}`);

  console.log('✂️  Dividindo em chunks...');
  const chunks = chunkText(text, 1500, 200);
  console.log(`   ${chunks.length} chunks gerados`);

  console.log('🧠 Gerando embeddings...');
  const embeddings = await embedTexts(chunks);
  console.log(`   ${embeddings.length} embeddings (${EMBEDDING_CONFIG.dimensions} dims)`);

  // Salva no Firestore
  const studyId = `${Date.now()}_${fileName.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}`;
  console.log(`💾 Salvando em corpus/studies/studies/${studyId}...`);

  const studyRef = db
    .collection('corpus').doc('studies').collection('studies').doc(studyId);

  await studyRef.set({
    titulo: fileName.replace(/\.pdf$/i, ''),
    fileName,
    status: 'active',
    classification: {
      natureza: ementa.natureza,
      tipoDocumento: ementa.tipoDocumento,
      areaDireito: ementa.areaDireito,
      assuntos: ementa.assuntos,
    },
    ementa: {
      areas: ementa.areas,
      topicos: ementa.topicos,
      conclusao: ementa.conclusao,
      keywords: ementa.keywords,
    },
    textContent: text.slice(0, 50000),
    chunkCount: chunks.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Salva chunks + embeddings em batch
  console.log('💾 Salvando chunks...');
  let saved = 0;
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = db.batch();
    const slice = chunks.slice(i, i + batchSize);
    for (let j = 0; j < slice.length; j++) {
      const position = i + j;
      const chunkRef = studyRef.collection('chunks').doc(`c${position.toString().padStart(4, '0')}`);
      batch.set(chunkRef, {
        position,
        content: slice[j],
        embedding: admin.firestore.FieldValue.vector(embeddings[position]),
        tokenCount: slice[j].length / 4, // estimativa
      });
    }
    await batch.commit();
    saved += slice.length;
    console.log(`   ${saved}/${chunks.length} chunks salvos`);
  }

  console.log(`✅ Ingestão concluída: ${studyId}`);
  console.log(`   Chunks: ${chunks.length}, Embeddings: ${embeddings.length}`);
  return { studyId, chunkCount: chunks.length };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: ts-node scripts/ingest-pdf.ts <caminho-do-pdf>');
  process.exit(1);
}

ingest(args[0])
  .then((result) => {
    console.log('🎉', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
