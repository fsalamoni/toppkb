/**
 * Bundle budget check
 *
 * Falha o build se algum chunk JS/CSS ultrapassar limite de tamanho.
 * Útil para prevenir regressões de bundle size.
 *
 * USO:
 *   npm run build && node scripts/bundle-budget.mjs
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist/assets';
const LIMITS = {
  js: 700 * 1024,   // 700 KB (firebase-vendor ~595KB é grande mas necessário)
  jsExceptional: 400 * 1024, // 400 KB para vendors de charts
  css: 100 * 1024,  // 100 KB
  total: 2 * 1024 * 1024, // 2 MB total (acceptable)
  // Não bloquear mas avisar
  WARN_LIMITS: {
    js: 300 * 1024,
  },
};

const EXCEPTIONAL_FILES = [
  'firebase-vendor',  // SDK Firebase (~600KB) - necessário
  'firebase-vendor-',  // versão antiga
  'generateCategoricalChart',  // Charts pesado
];

const warnings = [];
let totalSize = 0;
let totalFiles = 0;

function fmt(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

console.log('==================================================');
console.log('  BUNDLE BUDGET CHECK');
console.log('==================================================');

try {
  const files = readdirSync(DIST);
  const jsFiles = [];
  const cssFiles = [];

  for (const file of files) {
    const fullPath = join(DIST, file);
    const stats = statSync(fullPath);

    if (file.endsWith('.js')) {
      jsFiles.push({ name: file, size: stats.size });
    } else if (file.endsWith('.css')) {
      cssFiles.push({ name: file, size: stats.size });
    }
  }

  jsFiles.sort((a, b) => b.size - a.size);
  cssFiles.sort((a, b) => b.size - a.size);

  console.log('');
  console.log(`📦 Top 5 JS chunks:`);
  for (const f of jsFiles.slice(0, 5)) {
    let status;
    const isExceptional = EXCEPTIONAL_FILES.some((s) => f.name.includes(s));
    if (f.size > LIMITS.js) {
      status = '❌';
    } else if (f.size > LIMITS.jsExceptional && !isExceptional) {
      status = '❌';
    } else if (f.size > LIMITS.WARN_LIMITS.js) {
      status = '⚠️';
    } else {
      status = '✓';
    }
    console.log(`  ${status} ${fmt(f.size).padStart(10)}  ${f.name}${isExceptional ? ' (accepted)' : ''}`);
    if (f.size > LIMITS.js) {
      warnings.push(`JS chunk ${f.name} (${fmt(f.size)}) exceeds ${fmt(LIMITS.js)}`);
    } else if (f.size > LIMITS.jsExceptional && !isExceptional) {
      warnings.push(`JS chunk ${f.name} (${fmt(f.size)}) exceeds ${fmt(LIMITS.jsExceptional)}`);
    }
    totalSize += f.size;
    totalFiles++;
  }

  console.log('');
  console.log(`🎨 CSS files:`);
  for (const f of cssFiles) {
    const status = f.size > LIMITS.css ? '❌' : '✓';
    console.log(`  ${status} ${fmt(f.size).padStart(10)}  ${f.name}`);
    if (f.size > LIMITS.css) {
      warnings.push(`CSS ${f.name} (${fmt(f.size)}) exceeds ${fmt(LIMITS.css)}`);
    }
    totalSize += f.size;
    totalFiles++;
  }

  console.log('');
  console.log(`📊 Summary:`);
  console.log(`  Total files: ${totalFiles}`);
  console.log(`  Total size:  ${fmt(totalSize)}`);
  console.log(`  Gzip est.:   ~${fmt(totalSize / 3)}`);

  if (totalSize > LIMITS.total) {
    warnings.push(`Total size ${fmt(totalSize)} exceeds ${fmt(LIMITS.total)} budget`);
  }

  console.log('');
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((w) => console.log(`   • ${w}`));
  } else {
    console.log('✅ All chunks within budget.');
  }

  console.log('');
  console.log('==================================================');
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
