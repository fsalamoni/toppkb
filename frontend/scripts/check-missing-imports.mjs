#!/usr/bin/env node
/**
 * check-missing-imports.mjs — detecta símbolos de UI usados sem import
 *
 * OBJETIVO: prevenir bugs como "CardHeader is not defined" no build/runtime
 *
 * Procura em arquivos .tsx/.ts:
 * - Símbolos do shadcn-ui: Card, CardHeader, CardTitle, CardDescription,
 *   CardContent, CardFooter, Button, Input, Label, Select, Tabs, Dialog,
 *   DropdownMenu, Badge, Alert, Toast, Switch, etc.
 * - Verifica se há import correspondente
 *
 * USO:
 *   node scripts/check-missing-imports.mjs
 */
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src');

// Símbolos comuns que devem ser importados
const UI_SYMBOLS = [
  'Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter',
  'Button', 'Input', 'Label', 'Textarea', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
  'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
  'Dialog', 'DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
  'DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem',
  'Alert', 'AlertTitle', 'AlertDescription',
  'Badge', 'Switch', 'Slider', 'Progress', 'Skeleton',
  'Toast', 'Toaster', 'useToast',
];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules' || entry === 'dev') continue;
      results.push(...walk(path));
    } else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.test.tsx') && !entry.endsWith('.test.ts')) {
      results.push(path);
    }
  }
  return results;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const errors = [];

  for (const sym of UI_SYMBOLS) {
    // Verificar se usa o símbolo em JSX
    const usageRegex = new RegExp(`<${sym}\\b`, 'g');
    const usages = content.match(usageRegex);
    if (!usages) continue;

    // Verificar se importa
    const importRegex = new RegExp(`\\b${sym}\\b`, 'g');
    const allMatches = content.match(importRegex) || [];

    // Pelo menos 1 match deve ser um import
    const hasImport = content.includes(`import`) && (
      content.match(new RegExp(`\\b${sym}\\b`, 'g'))?.length > 0
    );

    // Conta: usos em JSX vs total
    // Se total === usos em JSX, então NÃO está importado
    if (allMatches.length <= usages.length) {
      // Verifica se tem pelo menos um import statement
      const hasImportStatement = content.match(
        new RegExp(`import\\s+(?:type\\s+)?(?:\\{[^}]*\\b${sym}\\b[^}]*\\}|\\b${sym}\\b)`, 'g'),
      );
      if (!hasImportStatement) {
        errors.push({
          file: relative(SRC_DIR, filePath),
          symbol: sym,
          usages: usages.length,
        });
      }
    }
  }

  return errors;
}

// Main
console.log('🔍 Verificando símbolos UI sem import...\n');

const files = walk(SRC_DIR);
let allErrors = [];

for (const file of files) {
  const errors = checkFile(file);
  allErrors.push(...errors);
}

if (allErrors.length === 0) {
  console.log('✅ Tudo OK! Todos os símbolos UI estão importados corretamente.\n');
  process.exit(0);
}

console.log(`❌ Encontrados ${allErrors.length} problema(s):\n`);
for (const err of allErrors) {
  console.log(`  - ${err.file}: <${err.symbol}> usado mas não importado (${err.usages}x)`);
}
console.log('\n💡 Adicione o símbolo ao import ou remova o uso.\n');
process.exit(1);
