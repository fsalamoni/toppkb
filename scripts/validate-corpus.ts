/**
 * Valida o corpus — verifica que todas as fontes referenciadas existem e estão bem formadas.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../data/raw');
const SOURCES = path.join(ROOT, 'sources.json');

interface Source {
  id: string;
  titulo: string;
  fonte: string;
  tags: string[];
}

async function main() {
  if (!fs.existsSync(SOURCES)) {
    console.error(`❌ ${SOURCES} não encontrado`);
    process.exit(1);
  }

  const sources: Source[] = JSON.parse(fs.readFileSync(SOURCES, 'utf-8'));
  console.log(`📚 Validando ${sources.length} fontes...`);

  let erros = 0;
  for (const s of sources) {
    // Validar campos obrigatórios
    if (!s.id || !s.titulo || !s.fonte) {
      console.error(`❌ ${s.id || '(sem id)'}: campos obrigatórios faltando`);
      erros++;
    }

    if (!s.tags || s.tags.length === 0) {
      console.warn(`⚠️  ${s.id}: sem tags`);
    }

    // Validar que existe conteúdo
    const possiveisCaminhos = [
      path.join(ROOT, 'rules', `${s.id}.md`),
      path.join(ROOT, 'technique', `${s.id}.md`),
      path.join(ROOT, 'strategy', `${s.id}.md`),
      path.join(ROOT, 'fitness', `${s.id}.md`),
      path.join(ROOT, 'nutrition', `${s.id}.md`),
    ];

    const existe = possiveisCaminhos.find((p) => fs.existsSync(p));
    if (!existe) {
      console.warn(`⚠️  ${s.id}: conteúdo não encontrado em nenhuma pasta`);
    } else {
      console.log(`✅ ${s.id}: ${path.relative(ROOT, existe)}`);
    }
  }

  if (erros > 0) {
    console.error(`\n❌ ${erros} erros encontrados`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todas as fontes validadas`);
  }
}

main();
