#!/usr/bin/env node
/**
 * 🔍 Auditor de caminhos Firestore
 *
 * Valida que TODOS os `doc(db, ...)` e `collection(db, ...)` no projeto
 * tenham o número correto de segmentos.
 *
 * Firestore rule:
 * - DocumentReference: número PAR de segmentos
 * - CollectionReference: número ÍMPAR de segmentos
 *
 * Executar: node scripts/audit-firestore-paths.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../src');

const DOC_REGEX = /doc\(\s*db\s*,([^)]+)\)/g;
const COLLECTION_REGEX = /collection\(\s*db\s*,([^)]+)\)/g;

function extractArgs(str) {
  // Divide por vírgula respeitando strings
  const args = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      current += c;
      if (c === stringChar && str[i - 1] !== '\\') {
        inString = false;
      }
    } else if (c === "'" || c === '"') {
      inString = true;
      stringChar = c;
      current += c;
    } else if (c === ',') {
      args.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args.filter((a) => a.length > 0);
}

function validatePath(args, kind, file) {
  const issues = [];
  // Para doc(db, ...): args alternam collection, doc, collection, doc, ...
  // Para collection(db, ...): args alternam collection, doc, collection, doc, ...
  // A regra: total de segmentos = args.length, deve ser par para doc, ímpar para collection

  const segCount = args.length;

  if (kind === 'doc' && segCount % 2 !== 0) {
    issues.push({
      file,
      kind,
      args,
      msg: `doc(db, ...) com ${segCount} segmentos (deve ser PAR)`,
    });
  }

  if (kind === 'collection' && segCount % 2 === 0) {
    issues.push({
      file,
      kind,
      args,
      msg: `collection(db, ...) com ${segCount} segmentos (deve ser ÍMPAR)`,
    });
  }

  return issues;
}

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

let totalChecked = 0;
let totalIssues = 0;
const issuesByFile = {};

for (const file of walkDir(SRC_DIR)) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(SRC_DIR, file);

  // doc(db, ...)
  let match;
  const docRegex = /doc\(\s*db\s*,([^)]+)\)/g;
  while ((match = docRegex.exec(content)) !== null) {
    totalChecked++;
    const args = extractArgs(match[1]);
    const issues = validatePath(args, 'doc', relPath);
    issues.forEach((i) => {
      totalIssues++;
      issuesByFile[relPath] = issuesByFile[relPath] || [];
      issuesByFile[relPath].push(i);
    });
  }

  // collection(db, ...)
  const colRegex = /collection\(\s*db\s*,([^)]+)\)/g;
  while ((match = colRegex.exec(content)) !== null) {
    totalChecked++;
    const args = extractArgs(match[1]);
    const issues = validatePath(args, 'collection', relPath);
    issues.forEach((i) => {
      totalIssues++;
      issuesByFile[relPath] = issuesByFile[relPath] || [];
      issuesByFile[relPath].push(i);
    });
  }
}

console.log(`\n📊 Auditei ${totalChecked} caminhos Firestore em ${Object.keys(issuesByFile).length} arquivos com problemas\n`);

if (totalIssues === 0) {
  console.log('✅ Todos os caminhos estão válidos!');
} else {
  console.error(`❌ ${totalIssues} problemas encontrados:\n`);
  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.error(`\n📁 ${file}:`);
    issues.forEach((i) => {
      console.error(`   ${i.msg}`);
      console.error(`   args: ${i.args.join(', ')}`);
    });
  }
  process.exit(1);
}
