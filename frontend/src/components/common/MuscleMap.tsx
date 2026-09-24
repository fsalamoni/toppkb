/**
 * MuscleMap — Anatomia visual clicável.
 *
 * Mostra silhueta humana (frente) com músculos destacados em cores.
 * Usuário clica em um músculo para ver descrição detalhada.
 *
 * Para usar:
 *   <MuscleMap exerciseId="kb-swing-2h-hardstyle" />
 *   <MuscleMap exercicio={obj} showAll={true} />  // mostra TODOS os músculos ativos
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Info } from 'lucide-react';
import {
  KETTLEBELL_EXERCICIOS,
  getMapaMuscularLeigo,
  getDicaMuscularCurta,
  getErroMuscularCurto,
  type ExercicioKettlebell,
} from '@/data/seed/exercicios-kettlebell';

interface MuscleMapProps {
  /** ID do exercício */
  exerciseId?: string;
  /** Objeto completo */
  exercicio?: ExercicioKettlebell;
  /** Mostrar todos os músculos (não só os top) */
  showAll?: boolean;
  /** Variant visual */
  variant?: 'card' | 'inline' | 'mini';
  className?: string;
}

interface MuscleInfo {
  id: string;
  /** Nome técnico */
  tecnico: string;
  /** Nome leigo (parte do corpo) */
  leigo?: string;
  /** Cor */
  color: string;
  /** Descrição leiga detalhada */
  descricao: string;
  /** Descrição do erro comum */
  erro?: string;
  /** Posição X na silhueta */
  x: number;
  /** Posição Y na silhueta */
  y: number;
  /** Raio da área clicável */
  r: number;
  /** Label curto */
  label: string;
  /** Intensidade (0-100) */
  intensidade?: number;
}

/**
 * Mapeamento: nome técnico → área do corpo (com coordenadas na silhueta)
 */
const MUSCLE_AREAS = {
  // Glúteo máximo / Bumbum
  'gluteo_maximo': { id: 'gluteo', x: 200, y: 410, r: 35, color: '#10b981', label: 'Bumbum' },
  'gluteo_medio': { id: 'gluteo_lat', x: 175, y: 405, r: 18, color: '#34d399', label: 'Lateral do quadril' },
  // Coxas
  'isquiotibial': { id: 'isquio', x: 215, y: 320, r: 28, color: '#22c55e', label: 'Parte de trás da coxa' },
  'quadriceps': { id: 'quad', x: 185, y: 320, r: 28, color: '#f59e0b', label: 'Frente da coxa' },
  'adutores': { id: 'adutor', x: 200, y: 290, r: 15, color: '#fbbf24', label: 'Parte interna da coxa' },
  // Panturrilha
  'panturrilha': { id: 'pantu', x: 200, y: 510, r: 22, color: '#fb923c', label: 'Bezer' },
  // Core / Barriga
  'core': { id: 'core', x: 200, y: 215, r: 28, color: '#ec4899', label: 'Barriga' },
  'obliquo': { id: 'obliq', x: 165, y: 220, r: 18, color: '#db2777', label: 'Lateral da barriga' },
  // Lombar
  'lombar': { id: 'lombar', x: 200, y: 245, r: 22, color: '#be185d', label: 'Parte baixa das costas' },
  // Tronco
  'peitoral': { id: 'peito', x: 200, y: 165, r: 28, color: '#06b6d4', label: 'Peito' },
  'latissimo': { id: 'lat', x: 175, y: 180, r: 25, color: '#0ea5e9', label: 'Costas (axila)' },
  'trapezio': { id: 'trap', x: 200, y: 110, r: 18, color: '#a855f7', label: 'Topo dos ombros' },
  // Ombro
  'deltoide': { id: 'ombro', x: 145, y: 140, r: 18, color: '#a855f7', label: 'Ombro' },
  // Braço
  'biceps': { id: 'biceps', x: 135, y: 195, r: 14, color: '#22d3ee', label: 'Frente do braço' },
  'triceps': { id: 'triceps', x: 265, y: 195, r: 14, color: '#0891b2', label: 'Parte de trás do braço' },
  'antebraco': { id: 'ante', x: 125, y: 250, r: 13, color: '#0284c7', label: 'Antebraço' },
  'grip': { id: 'grip', x: 125, y: 295, r: 13, color: '#0284c7', label: 'Mão/grip' },
};

const ALL_MUSCLE_IDS = Object.keys(MUSCLE_AREAS);

/**
 * Parse simples de um item do mapaMuscularLeigo para extrair o músculo.
 * Ex: "Glúteo máximo — drive" → 'gluteo_maximo'
 */
function parse_musculo(leigo: string): string | null {
  const lower = leigo.toLowerCase();
  for (const id of ALL_MUSCLE_IDS) {
    const nome = id.replace(/_/g, ' ').toLowerCase();
    if (lower.includes(nome) || lower.includes(id)) return id;
  }
  // Match parcial por keyword
  if (lower.includes('bumbum')) return 'gluteo_maximo';
  if (lower.includes('parte de trás da coxa') || lower.includes('isquio')) return 'isquiotibial';
  if (lower.includes('frente da coxa')) return 'quadriceps';
  if (lower.includes('parte interna')) return 'adutores';
  if (lower.includes('bezer') || lower.includes('panturrilha')) return 'panturrilha';
  if (lower.includes('barriga') || lower.includes('core')) return 'core';
  if (lower.includes('lateral da barriga')) return 'obliquo';
  if (lower.includes('costas') && lower.includes('baixa')) return 'lombar';
  if (lower.includes('peito') || lower.includes('peitoral')) return 'peitoral';
  if (lower.includes('costas')) return 'latissimo';
  if (lower.includes('topo dos ombros') || lower.includes('trapézio')) return 'trapezio';
  if (lower.includes('ombro')) return 'deltoide';
  if (lower.includes('frente do braço') || lower.includes('bíceps')) return 'biceps';
  if (lower.includes('tríceps') || lower.includes('parte de trás do braço')) return 'triceps';
  if (lower.includes('antebraço') || lower.includes('grip') || lower.includes('mão')) return 'antebraco';
  return null;
}

export function MuscleMap({
  exerciseId,
  exercicio,
  showAll = false,
  variant = 'card',
  className,
}: MuscleMapProps) {
  const ex = exercicio ?? (exerciseId ? KETTLEBELL_EXERCICIOS.find((e) => e.id === exerciseId) : null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // Calcular quais músculos estão ativos e suas intensidades
  const activeMuscles = useMemo(() => {
    if (!ex) return [] as Array<{ id: string; info: MuscleInfo; intensidade: number; leigoItem: string }>;
    const mapa = getMapaMuscularLeigo(ex.id) ?? [];
    const allActive: Array<{ id: string; info: MuscleInfo; intensidade: number; leigoItem: string }> = [];
    mapa.forEach((item, idx) => {
      const muscleId = parse_musculo(item);
      if (!muscleId || !MUSCLE_AREAS[muscleId as keyof typeof MUSCLE_AREAS]) return;
      const area = MUSCLE_AREAS[muscleId as keyof typeof MUSCLE_AREAS];
      // Quanto mais cedo na lista, mais intenso (top = 100)
      const intensidade = Math.max(50, 100 - idx * 10);
      allActive.push({
        id: muscleId,
        info: {
          ...area,
          tecnico: muscleId.replace(/_/g, ' '),
          descricao: item,
          erro: getErroMuscularCurto(ex.id) ?? undefined,
        },
        intensidade,
        leigoItem: item,
      });
    });
    return allActive;
  }, [ex]);

  const dicaGeral = ex ? getDicaMuscularCurta(ex.id) : '';

  const topId = activeMuscles[0]?.id;
  const selectedInfo = selectedMuscle ? activeMuscles.find((m) => m.id === selectedMuscle) : null;

  if (!ex) {
    return <div className="text-xs text-muted-foreground">Exercício não encontrado</div>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      {variant !== 'mini' && (
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold text-white">
            {showAll ? 'Todos os músculos' : 'Principais músculos'}
          </span>
          <span className="ml-auto text-xs text-blue-300">
            {activeMuscles.length} {activeMuscles.length === 1 ? 'músculo' : 'músculos'}
          </span>
        </div>
      )}

      {/* Silhueta */}
      <div className="relative bg-slate-950 rounded-lg border border-border overflow-hidden">
        <svg
          viewBox="0 0 400 600"
          className="w-full h-auto"
          aria-label="Mapa muscular"
          role="img"
        >
          {/* Plano de fundo */}
          <rect width="400" height="600" fill="#0f172a" />

          {/* Cabeça */}
          <circle cx="200" cy="80" r="28" fill="#475569" stroke="#64748b" strokeWidth="2" />
          {/* Pescoço */}
          <rect x="190" y="105" width="20" height="20" fill="#475569" rx="4" />

          {/* Tronco */}
          <rect x="160" y="130" width="80" height="120" fill="#475569" rx="8" />

          {/* Quadril */}
          <rect x="155" y="260" width="90" height="40" fill="#475569" rx="6" />

          {/* Coxas */}
          <rect x="160" y="290" width="30" height="120" fill="#475569" rx="6" />
          <rect x="210" y="290" width="30" height="120" fill="#475569" rx="6" />

          {/* Canela */}
          <rect x="167" y="420" width="20" height="80" fill="#475569" rx="4" />
          <rect x="213" y="420" width="20" height="80" fill="#475569" rx="4" />

          {/* Pés */}
          <ellipse cx="177" cy="525" rx="20" ry="6" fill="#475569" />
          <ellipse cx="223" cy="525" rx="20" ry="6" fill="#475569" />

          {/* Braços */}
          <rect x="125" y="135" width="22" height="100" fill="#475569" rx="5" />
          <rect x="253" y="135" width="22" height="100" fill="#475569" rx="5" />
          <rect x="120" y="240" width="22" height="60" fill="#475569" rx="5" />
          <rect x="258" y="240" width="22" height="60" fill="#475569" rx="5" />

          {/* Músculos ativos (clicáveis) */}
          {activeMuscles.map((m) => {
            const area = MUSCLE_AREAS[m.id as keyof typeof MUSCLE_AREAS];
            if (!area) return null;
            const isSelected = selectedMuscle === m.id;
            const isTop = topId === m.id;
            return (
              <g
                key={m.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(isSelected ? null : m.id)}
              >
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={area.r + (isSelected ? 4 : 0)}
                  fill={area.color}
                  opacity={m.intensidade / 100}
                  stroke={area.color}
                  strokeWidth={isSelected ? 3 : 2}
                />
                {/* Tooltip no top */}
                {isTop && (
                  <text
                    x={area.x}
                    y={area.y + 5}
                    fontSize="11"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {area.label}
                  </text>
                )}
                {isSelected && (
                  <text
                    x={area.x}
                    y={area.y + 5}
                    fontSize="11"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {area.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {variant !== 'mini' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
            CLIQUE NUM MÚSCULO
          </div>
        )}
      </div>

      {/* Descrição geral (se não há músculo selecionado) */}
      {!selectedInfo && variant !== 'mini' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-1">
          <div className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
            💪 Onde sentir
          </div>
          <p className="text-xs text-blue-100 leading-snug">
            {dicaGeral || ex.sensacaoPrincipal || 'Veja os músculos destacados em azul/verde na silhueta acima.'}
          </p>
        </div>
      )}

      {/* Descrição do músculo selecionado */}
      {selectedInfo && variant !== 'mini' && (
        <div
          className="rounded-lg border p-3 space-y-1"
          style={{
            borderColor: selectedInfo.info.color,
            backgroundColor: `${selectedInfo.info.color}10`,
          }}
        >
          <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: selectedInfo.info.color }}>
            <Info className="h-3.5 w-3.5" />
            {selectedInfo.info.label}
            <span className="text-xs opacity-70 font-normal ml-auto">
              {selectedInfo.intensidade}% intensidade
            </span>
          </div>
          <p className="text-xs leading-snug" style={{ color: 'white' }}>
            <span className="font-semibold">Onde:</span> {selectedInfo.leigoItem}
          </p>
          {selectedInfo.info.erro && (
            <p className="text-xs leading-snug mt-1 text-amber-100">
              <span className="font-semibold text-amber-400">⚠️ Erro comum:</span> {selectedInfo.info.erro}
            </p>
          )}
        </div>
      )}

      {/* Lista de músculos (sempre visível) */}
      {variant !== 'mini' && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Todos os músculos ativos:</div>
          <div className="flex flex-wrap gap-1">
            {activeMuscles.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMuscle(m.id === selectedMuscle ? null : m.id)}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-md border transition-colors',
                  selectedMuscle === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-foreground border-border hover:bg-muted/70'
                )}
                style={{
                  borderColor: selectedMuscle === m.id ? m.info.color : undefined,
                  backgroundColor: selectedMuscle === m.id ? `${m.info.color}30` : undefined,
                }}
              >
                {m.info.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
