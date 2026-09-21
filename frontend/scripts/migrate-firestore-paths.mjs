#!/usr/bin/env node
/**
 * 🔧 Migração automática dos caminhos Firestore
 *
 * Substitui:
 *   collection(db, 'toppkb_users', uid, 'treinamento', 'sessoes')
 * Por:
 *   treinoCol(db, uid, 'sessoes')
 *
 * Para todas as sub-collections: sessoes, planos, metas, notas,
 * avaliacoes, templates, composicao, prs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../src');

const SUBS = ['sessoes', 'planos', 'metas', 'notas', 'avaliacoes', 'templates', 'composicao', 'prs'];

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (/\.(ts|tsx)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

let totalChanges = 0;
const changesByFile = {};

for (const file of walkDir(SRC_DIR)) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  const relPath = path.relative(SRC_DIR, file);

  // Para cada subcollection X:
  for (const sub of SUBS) {
    // Pattern 1: collection(db, 'toppkb_users', user.uid, 'treinamento', sub)
    const colRegex = new RegExp(
      `collection\\(\\s*db\\s*,\\s*'toppkb_users'\\s*,\\s*([a-zA-Z_$.\\?]+)\\s*,\\s*'treinamento'\\s*,\\s*'${sub}'\\s*\\)`,
      'g',
    );
    content = content.replace(colRegex, `treinoCol(db, $1, '${sub}')`);

    // Pattern 2: doc(db, 'toppkb_users', user.uid, 'treinamento', sub, idVar)
    const docRegex = new RegExp(
      `doc\\(\\s*db\\s*,\\s*'toppkb_users'\\s*,\\s*([a-zA-Z_$.\\?]+)\\s*,\\s*'treinamento'\\s*,\\s*'${sub}'\\s*,\\s*([a-zA-Z_$.\\?]+)\\s*\\)`,
      'g',
    );
    content = content.replace(docRegex, `treinoDoc(db, $1, '${sub}', $2)`);

    // Detecta mudanças
    const newColCount = (content.match(new RegExp(`treinoCol\\(db, $1, '${sub}'\\)`, 'g')) || []).length;
    const oldColCount = (file ? fs.readFileSync(file, 'utf-8').match(new RegExp(`collection\\(\\s*db\\s*,\\s*'toppkb_users'\\s*,\\s*[a-zA-Z_$.\\?]+\\s*,\\s*'treinamento'\\s*,\\s*'${sub}'\\s*\\)`, 'g')) : null) || [];
    if (newColCount > 0 && oldColCount.length > 0) {
      const totalOld = (file ? fs.readFileSync(file, 'utf-8').match(new RegExp(`collection\\(\\s*db\\s*,\\s*'toppkb_users'\\s*,\\s*[a-zA-Z_$.\\?]+\\s*,\\s*'treinamento'\\s*,\\s*'${sub}'\\s*\\)`, 'g')) : null) || [];
      const totalNew = (content.match(new RegExp(`treinoCol\\(db, [a-zA-Z_$.\\?]+, '${sub}'\\)`, 'g')) || []).length;
      const change = totalOld.length;
      if (change > 0) {
        totalChanges += change;
        changesByFile[relPath] = (changesByFile[relPath] || 0) + change;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
  }
}

console.log(`\n📊 Migrei ${totalChanges} referências em ${Object.keys(changesByFile).length} arquivos:\n`);
for (const [file, count] of Object.entries(changesByFile)) {
  console.log(`  ${file}: ${count}`);
}
