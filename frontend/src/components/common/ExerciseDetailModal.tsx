/**
 * ExerciseDetailModal — modal completo para visualizar detalhes de exercício
 *
 * Mostra:
 * - Vídeo de demonstração
 * - Galeria de imagens de etapas
 * - Passos numerados com descrição detalhada
 * - Cues técnicos + erros comuns
 * - Alertas 50+, contraindicações
 * - Evidências científicas + referências
 * - Fontes externas (Wikimedia, StrongFirst, PubMed)
 *
 * USO:
 *   const [ex, setEx] = useState<ExercicioKettlebell | null>(null);
 *   <ExerciseDetailModal exercicio={ex} onClose={() => setEx(null)} />
 *
 * Ou via hook:
 *   const { showExercise, ModalRoot } = useExerciseModal();
 *   <button onClick={() => showExercise(ex)}>Ver detalhes</button>
 *   {ModalRoot}
 */
import {
  X, ChevronLeft, ChevronRight, ExternalLink, Info, AlertTriangle,
  Award, Video, Image as ImageIcon, BookOpen, Target,
  Heart, Brain, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { ExercicioKettlebell } from '@/data/seed/exercicios-kettlebell';

interface ExerciseDetailModalProps {
  exercicio: ExercicioKettlebell | null;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercicio, onClose }: ExerciseDetailModalProps) {
  if (!exercicio) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <ExerciseHeader exercicio={exercicio} onClose={onClose} />
        <ExerciseBody exercicio={exercicio} />
      </div>
    </div>
  );
}

/**
 * Header com vídeo (ou imagem principal) + botão fechar
 */
function ExerciseHeader({
  exercicio,
  onClose,
}: {
  exercicio: ExercicioKettlebell;
  onClose: () => void;
}) {
  const [showVideo, setShowVideo] = useState(!!exercicio.videoUrl);

  if (showVideo && exercicio.videoUrl) {
    return (
      <div className="aspect-video bg-black relative">
        <video
          src={exercicio.videoUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full"
          poster={exercicio.thumbnailUrl || exercicio.imageUrl}
        />
        {exercicio.imageUrl && (
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-2 left-2 p-2 bg-black/70 hover:bg-black/90 rounded-full flex items-center gap-2 px-3"
            title="Ver imagens"
          >
            <ImageIcon className="h-4 w-4 text-white" />
            <span className="text-white text-xs">Imagens</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gradient-to-br from-emerald-500/30 to-slate-900 relative flex items-center justify-center">
      {exercicio.imageUrl ? (
        <img
          src={exercicio.imageUrl}
          alt={exercicio.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-8xl">🏋️</span>
      )}
      {exercicio.videoUrl && (
        <button
          onClick={() => setShowVideo(true)}
          className="absolute bottom-3 left-3 p-2 bg-black/70 hover:bg-black/90 rounded-full flex items-center gap-2 px-3"
        >
          <Video className="h-4 w-4 text-white" />
          <span className="text-white text-xs">Ver vídeo</span>
        </button>
      )}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full"
        aria-label="Fechar"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}

/**
 * Body: Info + Galeria + Steps + Detalhes
 */
function ExerciseBody({ exercicio }: { exercicio: ExercicioKettlebell }) {
  const gallery = exercicio.galleryImages ?? [];
  const steps = exercicio.steps ?? [];

  return (
    <div className="p-6 space-y-5">
      {/* TÍTULO + BADGES */}
      <ExerciseTitle exercicio={exercicio} />

      {/* DESCRIÇÃO */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-1">
          Descrição
        </h3>
        <p className="text-sm leading-relaxed">{exercicio.descricao}</p>
      </div>

      {/* MAPA MUSCULAR LEIGO (ONDE SENTIR) */}
      {exercicio.mapaMuscularLeigo && exercicio.mapaMuscularLeigo.length > 0 && (
        <ExerciseMapaMuscular mapa={exercicio.mapaMuscularLeigo} />
      )}

      {/* SENSAÇÃO PRINCIPAL (linguagem leiga) */}
      {exercicio.sensacaoPrincipal && (
        <ExerciseSensacaoPrincipal texto={exercicio.sensacaoPrincipal} />
      )}

      {/* ANALOGIA INICIAL (linguagem leiga) */}
      {exercicio.analogiaInicial && (
        <ExerciseAnalogiaInicial texto={exercicio.analogiaInicial} />
      )}

      {/* ERRO MUSCULAR (o que acontece se fizer errado) */}
      {exercicio.erroMuscular && (
        <ExerciseErroMuscular texto={exercicio.erroMuscular} />
      )}

      {/* CARGA INICIAL 50+ */}
      {exercicio.cargaInicial50mais && (
        <ExerciseCargaInicial texto={exercicio.cargaInicial50mais} />
      )}

      {/* GALERIA DE IMAGENS (etapas visuais) */}
      {gallery.length > 0 && (
        <ExerciseGallery gallery={gallery} />
      )}

      {/* STEPS (passo a passo) */}
      {steps.length > 0 && (
        <ExerciseSteps steps={steps} />
      )}

      {/* CUES TÉCNICOS */}
      {exercicio.cues && exercicio.cues.length > 0 && (
        <ExerciseCues cues={exercicio.cues} />
      )}

      {/* DICAS */}
      {exercicio.dicas && exercicio.dicas.length > 0 && (
        <ExerciseDicas dicas={exercicio.dicas} />
      )}

      {/* ERROS COMUNS */}
      {exercicio.errors && exercicio.errors.length > 0 && (
        <ExerciseErrors errors={exercicio.errors} />
      )}

      {/* ALERTA 50+ */}
      {exercicio.alerta50mais && (
        <ExerciseAlerta50 mensagem={exercicio.alerta50mais} />
      )}

      {/* CONTRAINDICAÇÕES */}
      {exercicio.contraIndicacoes && exercicio.contraIndicacoes.length > 0 && (
        <ExerciseContraindicacoes contra={exercicio.contraIndicacoes} />
      )}

      {/* EVIDÊNCIA CIENTÍFICA */}
      {exercicio.evidencia && (
        <ExerciseEvidencia
          evidencia={exercicio.evidencia}
          referencias={exercicio.referencias ?? []}
        />
      )}

      {/* FONTES EXTERNAS */}
      {exercicio.fontesExternas && exercicio.fontesExternas.length > 0 && (
        <ExerciseFontesExternas fontes={exercicio.fontesExternas} />
      )}

      {/* CTAs */}
      <ExerciseCTAs />
    </div>
  );
}

function ExerciseTitle({ exercicio }: { exercicio: ExercicioKettlebell }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          {exercicio.nivel}
        </Badge>
        <Badge className="bg-card text-foreground border border-border">
          {exercicio.equipamento}
        </Badge>
        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
          {exercicio.padraoMovimento}
        </Badge>
        {exercicio.padraoKb && (
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            {exercicio.padraoKb}
          </Badge>
        )}
      </div>
      <h2 id="exercise-title" className="text-2xl font-bold">
        {exercicio.nome}
      </h2>
      <p className="text-sm text-emerald-400 mt-1">
        <Target className="inline h-4 w-4 mr-1" />
        Foco: {exercicio.focoPrincipal}
      </p>
      {exercicio.musculosSecundarios.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Auxiliares: {exercicio.musculosSecundarios.join(', ')}
        </p>
      )}
    </div>
  );
}

function ExerciseGallery({
  gallery,
}: {
  gallery: NonNullable<ExercicioKettlebell['galleryImages']>;
}) {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <ImageIcon className="h-4 w-4" />
        Galeria ({gallery.length} {gallery.length === 1 ? 'imagem' : 'imagens'})
      </h3>
      <div className="border rounded-lg overflow-hidden bg-muted/30">
        <div className="relative aspect-video bg-muted">
          <img
            src={gallery[index].src}
            alt={gallery[index].alt}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          {gallery.length > 1 && (
            <>
              <button
                onClick={() => setIndex((i) => (i === 0 ? gallery.length - 1 : i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => setIndex((i) => (i === gallery.length - 1 ? 0 : i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-all',
                      i === index ? 'bg-white w-6' : 'bg-white/40',
                    )}
                    aria-label={`Ir para imagem ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-3 text-sm">
          <p className="leading-relaxed">{gallery[index].caption}</p>
          {gallery[index].source && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Fonte: {gallery[index].source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExerciseSteps({
  steps,
}: {
  steps: NonNullable<ExercicioKettlebell['steps']>;
}) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <BookOpen className="h-4 w-4" />
        Passo a Passo ({steps.length} {steps.length === 1 ? 'etapa' : 'etapas'})
      </h3>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.numero}
            className="border-l-2 border-emerald-500 pl-4 py-2 space-y-1"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-emerald-400">
                #{step.numero}
              </span>
              <h4 className="font-semibold text-sm">{step.titulo}</h4>
              {step.duracaoSeg !== undefined && step.duracaoSeg > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({step.duracaoSeg}s)
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed pl-8">{step.descricao}</p>
            {step.cues && step.cues.length > 0 && (
              <div className="pl-8 pt-1 flex flex-wrap gap-1">
                {step.cues.map((cue, i) => (
                  <span
                    key={i}
                    className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  >
                    "{cue}"
                  </span>
                ))}
              </div>
            )}
            {step.sensacoes && step.sensacoes.length > 0 && (
              <details className="pl-8 pt-1">
                <summary className="text-xs cursor-pointer text-blue-400 hover:text-blue-300">
                  💪 Onde e como sentir ({step.sensacoes.length} sensações)
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {step.sensacoes.map((s, i) => (
                    <li key={i} className="text-xs text-blue-300 leading-snug">
                      • {s}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {step.alertasMusculares && step.alertasMusculares.length > 0 && (
              <details className="pl-8 pt-1">
                <summary className="text-xs cursor-pointer text-amber-400 hover:text-amber-300">
                  ⚠️ Atenção muscular ({step.alertasMusculares.length} alertas)
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {step.alertasMusculares.map((a, i) => (
                    <li key={i} className="text-xs text-amber-300 leading-snug">
                      ⚠ {a}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ExerciseCues({ cues }: { cues: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
        💬 Cues Técnicos
      </h3>
      <div className="flex flex-wrap gap-2">
        {cues.map((cue, i) => (
          <span
            key={i}
            className="inline-block text-sm px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          >
            "{cue}"
          </span>
        ))}
      </div>
    </div>
  );
}

function ExerciseDicas({ dicas }: { dicas: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
        ✅ Dicas
      </h3>
      <ul className="space-y-1 text-sm">
        {dicas.map((d, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-400">→</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseErrors({ errors }: { errors: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
        ❌ Erros Comuns
      </h3>
      <ul className="space-y-1 text-sm">
        {errors.map((e, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-rose-400">✗</span>
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseAlerta50({ mensagem }: { mensagem: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-amber-400 mb-1 flex items-center gap-1">
        <Heart className="h-4 w-4" />
        Atenção 50+
      </h3>
      <p className="text-sm">{mensagem}</p>
    </div>
  );
}

function ExerciseContraindicacoes({ contra }: { contra: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        Contraindicações
      </h3>
      <ul className="space-y-1 text-sm">
        {contra.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-rose-400">⚠</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseEvidencia({
  evidencia,
  referencias,
}: {
  evidencia: string;
  referencias: string[];
}) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-blue-400 mb-1 flex items-center gap-1">
        <Brain className="h-4 w-4" />
        Evidência Científica
      </h3>
      <p className="text-sm">{evidencia}</p>
      {referencias.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          Refs: {referencias.join(' · ')}
        </p>
      )}
    </div>
  );
}

function ExerciseMapaMuscular({ mapa }: { mapa: string[] }) {
  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-blue-400 mb-2 flex items-center gap-1">
        💪 ONDE SENTIR (Mapa Muscular)
      </h3>
      <ul className="space-y-1">
        {mapa.map((item, i) => (
          <li key={i} className="text-sm text-blue-200 leading-snug">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseSensacaoPrincipal({ texto }: { texto: string }) {
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-emerald-400 mb-1 flex items-center gap-1">
        ✨ SENSACÃO PRINCIPAL
      </h3>
      <p className="text-sm text-emerald-100 leading-relaxed">{texto}</p>
    </div>
  );
}

function ExerciseAnalogiaInicial({ texto }: { texto: string }) {
  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-purple-400 mb-1 flex items-center gap-1">
        🪑 PENSE ASSIM (Analogia)
      </h3>
      <p className="text-sm text-purple-100 leading-relaxed italic">{texto}</p>
    </div>
  );
}

function ExerciseErroMuscular({ texto }: { texto: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-amber-400 mb-1 flex items-center gap-1">
        ⚠️ ERRO MUSCULAR COMUM
      </h3>
      <p className="text-sm text-amber-100 leading-relaxed">{texto}</p>
    </div>
  );
}

function ExerciseCargaInicial({ texto }: { texto: string }) {
  return (
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-cyan-400 mb-1 flex items-center gap-1">
        🏋️ CARGA INICIAL (50+)
      </h3>
      <p className="text-sm text-cyan-100 leading-relaxed">{texto}</p>
    </div>
  );
}

function ExerciseFontesExternas({
  fontes,
}: {
  fontes: NonNullable<ExercicioKettlebell['fontesExternas']>;
}) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <BookOpen className="h-4 w-4" />
        Fontes Externas
      </h3>
      <ul className="space-y-1.5 text-sm">
        {fontes.map((f, i) => (
          <li key={i}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              {f.name}
              <ExternalLink className="h-3 w-3" />
            </a>
            {f.license && (
              <span className="text-xs text-muted-foreground ml-2">
                ({f.license})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseCTAs() {
  return (
    <div className="flex gap-2 pt-2">
      <Button asChild variant="outline" className="flex-1">
        <a href="/app/preparacao/nova">
          <Activity className="h-4 w-4 mr-1" />
          Usar em Sessão
        </a>
      </Button>
      <Button asChild className="flex-1">
        <a href="/app/periodizacao">
          <Award className="h-4 w-4 mr-1" />
          Ver Periodização
        </a>
      </Button>
    </div>
  );
}

/**
 * Hook helper para abrir modal de qualquer lugar
 *
 * USO:
 *   const { showExercise, ModalRoot } = useExerciseModal();
 *   <button onClick={() => showExercise(ex)}>Ver detalhes</button>
 *   return <>{ModalRoot}</>;
 */
export function useExerciseModal() {
  const [exercicio, setExercicio] = useState<ExercicioKettlebell | null>(null);

  return {
    showExercise: (ex: ExercicioKettlebell) => setExercicio(ex),
    hideExercise: () => setExercicio(null),
    ModalRoot: exercicio ? (
      <ExerciseDetailModal
        exercicio={exercicio}
        onClose={() => setExercicio(null)}
      />
    ) : null,
  };
}

const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      className,
    )}
  >
    {children}
  </span>
);
