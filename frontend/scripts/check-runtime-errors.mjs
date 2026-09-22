#!/usr/bin/env node
/**
 * check-runtime-errors.mjs — detecta possíveis erros de runtime
 *
 * Procura símbolos comuns sendo USADOS (não declarados) sem import:
 * - React hooks: useState, useEffect, useCallback, etc.
 * - React Router: Link, useNavigate, useParams, etc.
 * - Firebase Firestore: doc, collection, getDoc, getDocs, etc.
 * - Custom hooks/funções do projeto
 *
 * Filtra falsos positivos:
 * - Comentários
 * - JSX com mesmo nome (não bloqueia)
 * - Declarações locais (function/const)
 * - Propriedades de objeto (limit: 50)
 * - Imports parciais (import { db } from...)
 *
 * USO:
 *   node scripts/check-runtime-errors.mjs
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src');

// Símbolos comuns que devem ser importados
// Apenas tokens que são usados EXATAMENTE assim (sem prefixo use/get/set/etc)
const SYMBOLS = [
  // React hooks (palavras com prefixo use_)
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect',
  // React Router
  'Link', 'useNavigate', 'useParams', 'useLocation', 'useSearchParams', 'useRouteError',
  // Firebase Firestore (funções)
  'doc', 'collection', 'where', 'getDocs', 'getDoc', 'setDoc', 'addDoc', 'updateDoc', 'deleteDoc', 'orderBy', 'limit', 'Timestamp', 'serverTimestamp',
  // Firebase instances
  'db', 'auth', 'storage',
  // Custom helpers
  'logError', 'listErrors', 'clearAllErrors',
  'withTimeout',
];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules' || entry === 'dev' || entry === 'test') continue;
      results.push(...walk(path));
    } else if (/\.(tsx|ts)$/.test(entry) && !/\.test\./.test(entry) && !/\.spec\./.test(entry)) {
      results.push(path);
    }
  }
  return results;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const errors = [];

  // Remove comments para evitar falsos positivos
  const noComments = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  for (const sym of SYMBOLS) {
    // Pular se não tem uso no código (sem comments)
    const usageRegex = new RegExp(`\\b${sym}\\b`, 'g');
    const usages = noComments.match(usageRegex);
    if (!usages || usages.length === 0) continue;

    // Verifica se é declaração local (function/const/let/var/type/interface)
    const declarationRegex = new RegExp(
      `(function\\s+${sym}\\b|const\\s+${sym}\\b|let\\s+${sym}\\b|var\\s+${sym}\\b|type\\s+${sym}\\b|interface\\s+${sym}\\b)`,
    );
    if (declarationRegex.test(content)) continue;

    // Verifica se é uso como property key (objeto)
    // padrão: : sym ou { sym: ou , sym:
    const propertyRegex = new RegExp(`[{:,\\s]\\s*${sym}\\s*[:?]`, 'g');
    if (propertyRegex.test(content)) {
      // Se tem match de property, verificar se também tem uso real (como chamada ou tag)
      const callRegex = new RegExp(`\\b${sym}\\s*\\(`, 'g'); // função
      const jsxRegex = new RegExp(`<${sym}\\b`, 'g'); // JSX tag
      if (!callRegex.test(noComments) && !jsxRegex.test(noComments)) continue;
    }

    // Verifica se há import statement
    const importRegex = new RegExp(
      `import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${sym}\\b[^}]*\\}|${sym})`,
    );
    if (importRegex.test(content)) continue;

    // Verifica uso via namespace (React.useState, Firebase.db, etc)
    const namespaceRegex = new RegExp(
      `(?:React|Firebase|firebase|firebase\\.firestore|firebase\\.app)\\.${sym}\\b`,
    );
    if (namespaceRegex.test(content)) continue;

    // Se arquivo usa await import (dynamic), ignorar avisos
    // (assume que o dynamic import é usado para resolver circular deps)
    if (/await\s+import\s*\(/.test(content)) continue;

    // Verifica uso via destructuring parcial (e.g., {query, where} from react-query)
    const partialRegex = new RegExp(
      `\\b${sym}\\s*[,:]`, // termina com vírgula ou dois-pontos em {...}
    );
    if (partialRegex.test(content)) {
      // verifica se está num import destructured
      const inImport = new RegExp(
        `import\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from`,
      );
      if (inImport.test(content)) continue;
    }

    // Verifica uso dentro de strings de import paths (e.g., 'firebase/auth')
    const importPathRegex = new RegExp(
      `['"][^'"]*${sym}[^'"]*['"]`,
    );
    if (importPathRegex.test(content)) continue;

    // Verifica uso dentro de tags JSX (e.g., <code>collection</code>)
    const jsxTextRegex = new RegExp(
      `<\\w+[^>]*>[^<]*\\b${sym}\\b[^<]*</\\w+>`,
    );
    if (jsxTextRegex.test(content)) continue;

    // Verifica uso como parâmetro de função (db: TFirestore)
    const paramRegex = new RegExp(
      `\\([^)]*\\b${sym}\\b\\s*:\\s*\\w+`, // (db: Type) ou , db: Type
    );
    if (paramRegex.test(content)) {
      // Verifica que não é apenas um objeto property (db: {})
      const propOnlyRegex = new RegExp(
        `\\{\\s*${sym}\\s*:\\s*\\{`, // { db: { ... } }
      );
      if (!propOnlyRegex.test(content)) continue;
    }

    // Verifica uso como nome de variável local (let/const/var db = ...)
    const varDeclRegex = new RegExp(
      `\\b(?:let|const|var)\\s+${sym}\\s*=`,
    );
    if (varDeclRegex.test(content)) continue;

    // Verifica uso como propriedade de objeto (db.something OR {db: ...})
    // mas não como chamada direta
    const propAccessRegex = new RegExp(
      `\\.${sym}\\b|\\b${sym}\\s*\\.`,
    );
    if (propAccessRegex.test(content)) {
      // se usa como propriedade mas NÃO chama (sem ()), é só acesso
      const callRegex = new RegExp(`\\b${sym}\\s*\\(`);
      if (!callRegex.test(content)) continue;
    }

    // Se chegou aqui, é uso sem import
    errors.push({ file: relative(SRC_DIR, filePath), symbol: sym });
  }

  return errors;
}

// Main
console.log('🔍 Verificando possíveis erros de runtime...\n');

const files = walk(SRC_DIR);
let allErrors = [];

for (const file of files) {
  const errors = checkFile(file);
  allErrors.push(...errors);
}

if (allErrors.length === 0) {
  console.log('✅ Tudo OK! Nenhum erro de runtime detectado.\n');
  process.exit(0);
}

console.log(`❌ Encontrados ${allErrors.length} possível(is) erro(s) de runtime:\n`);
for (const err of allErrors) {
  console.log(`  - ${err.file}: '${err.symbol}' usado sem import`);
}
console.log('\n💡 Adicione o símbolo ao import ou remova o uso.\n');
process.exit(1);
