# Plano de Evolução — Conteúdo de Exercícios

## FASE 1: Exploração ✅
- 93 exercícios kettlebell + 40 gerais = 133 totais
- 229 imagens locais + 84 vídeos MP4
- Modal ExerciseDetail já existe em /app/exercicios
- Sources: Hardstyle, Pavel Tsatsouline, McGill (back science)

## FASE 2: Gaps identificados ✅
- ❌ Galeria multi-imagens (apenas 1 por exercício)
- ❌ Componente reutilizável fora de Exercicios.tsx
- ❌ Exibir detalhes em PreparacaoForm, PreparacaoList, Treinamento*
- ❌ Validação final de URLs de imagens

## FASE 3: Pesquisa de conteúdo aberto
- Wikimedia Commons (fotos livres)
- YouTube Creative Commons (vídeos)
- Wikipedia (texto descritivo)

## FASE 4: Modelo Exercise expandido
```ts
interface ExerciseEnhanced {
  // básico (existente)
  id, nome, grupo, padraoMovimento
  // novo
  steps: { nome: string, descricao: string, duracaoSeg: number, imagemUrl: string }[]
  videoUrl: string
  galleryImages: { src: string, alt: string, caption: string }[]
  referencias: { source: string, url: string }[]
}
```

## FASE 5: Componente ExerciseDetailModal reutilizável
- Move de Exercicios.tsx para components/common/
- Props: exercicio, onClose
- Vídeo + galeria + accordion de etapas

## FASE 6: Conectar em outras páginas
- PreparacaoList: clicar no nome abre modal
- TreinamentoSessoesForm: select + botão "ver detalhes"
- TreinamentoMeuPrograma: executar mostra resumo de cada exercício

## FASE 7: Validação
- Build + Lint + Test
