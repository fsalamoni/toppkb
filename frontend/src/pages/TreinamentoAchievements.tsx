/**
 * 🏋️ Treinamento · Achievements (Badges)
 *
 * Calcula automaticamente quais badges o usuário desbloqueou
 * com base no histórico de sessões.
 *
 * Sub-rota: /app/treinamento/achievements
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/common/LoadingScreen';
import {
  ChevronLeft, Award, Lock, Trophy, Target, Flame, Heart,
  Dumbbell, Activity, Zap, Star, Crown, Calendar,
} from 'lucide-react';

interface Sessao {
  id: string;
  data: string;
  tipo?: string;
  duracaoMin?: number;
  volumeTotal?: number;
  rpeMedio?: number;
  exercicios?: any[];
}

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: any;
  cor: string;
  desbloqueado: boolean;
  progresso?: number;
  meta?: number;
  bloqueadoMsg?: string;
}

export function TreinamentoAchievements() {
  const { user } = useAuth();

  const { data: sessoes, isLoading } = useQuery({
    queryKey: ['treinamento-badges', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sessao));
    },
    enabled: !!user,
  });

  // Calcula badges baseado nas sessões
  const badges = useMemo<Badge[]>(() => {
    const sessoesArr = sessoes || [];
    const total = sessoesArr.length;
    const totalVolume = sessoesArr.reduce((acc, s) => acc + (Number(s.volumeTotal) || 0), 0);
    const totalMinutos = sessoesArr.reduce((acc, s) => acc + (Number(s.duracaoMin) || 0), 0);

    // Streak atual
    let streakAtual = 0;
    if (total > 0) {
      const datas = new Set(sessoesArr.map((s) => new Date(s.data).toISOString().slice(0, 10)));
      const cursor = new Date();
      const maxIter = 365;
      let iter = 0;
      while (iter++ < maxIter && datas.has(cursor.toISOString().slice(0, 10))) {
        streakAtual++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Total exercícios KB usados
    const exerciciosKB = new Set<string>();
    sessoesArr.forEach((s) => {
      (s.exercicios || []).forEach((ex: any) => {
        if (ex.exercicioId?.startsWith('kb-')) {
          exerciciosKB.add(ex.exercicioId);
        }
      });
    });

    // Tipos diferentes
    const tiposFeitos = new Set(sessoesArr.map((s) => s.tipo).filter(Boolean));

    return [
      {
        id: 'primeira-sessao',
        nome: 'Primeira Sessão',
        descricao: 'Registrou a primeira sessão de treino',
        icone: Star,
        cor: 'amber',
        desbloqueado: total >= 1,
        progresso: Math.min(total, 1),
        meta: 1,
      },
      {
        id: '10-sessoes',
        nome: '10 Sessões',
        descricao: 'Completou 10 sessões de treino',
        icone: Activity,
        cor: 'emerald',
        desbloqueado: total >= 10,
        progresso: Math.min(total, 10),
        meta: 10,
      },
      {
        id: '50-sessoes',
        nome: '50 Sessões',
        descricao: 'Completou 50 sessões — veterania',
        icone: Trophy,
        cor: 'blue',
        desbloqueado: total >= 50,
        progresso: Math.min(total, 50),
        meta: 50,
      },
      {
        id: '100-sessoes',
        nome: '100 Sessões',
        descricao: 'Centenário de treinos! Disciplina.',
        icone: Crown,
        cor: 'purple',
        desbloqueado: total >= 100,
        progresso: Math.min(total, 100),
        meta: 100,
      },
      {
        id: 'streak-7',
        nome: 'Streak 7 dias',
        descricao: 'Treinou 7 dias consecutivos',
        icone: Flame,
        cor: 'orange',
        desbloqueado: streakAtual >= 7,
        progresso: Math.min(streakAtual, 7),
        meta: 7,
        bloqueadoMsg: `${streakAtual}/7 dias`,
      },
      {
        id: 'streak-30',
        nome: 'Streak 30 dias',
        descricao: 'Treinou 30 dias consecutivos — elite',
        icone: Flame,
        cor: 'red',
        desbloqueado: streakAtual >= 30,
        progresso: Math.min(streakAtual, 30),
        meta: 30,
        bloqueadoMsg: `${streakAtual}/30 dias`,
      },
      {
        id: 'volume-1000',
        nome: '1 Tonelada',
        descricao: 'Acumulou 1.000 kg de volume total',
        icone: Dumbbell,
        cor: 'rose',
        desbloqueado: totalVolume >= 1000,
        progresso: Math.min(totalVolume, 1000),
        meta: 1000,
      },
      {
        id: 'volume-10000',
        nome: '10 Toneladas',
        descricao: 'Acumulou 10.000 kg de volume total',
        icone: Dumbbell,
        cor: 'amber',
        desbloqueado: totalVolume >= 10000,
        progresso: Math.min(totalVolume, 10000),
        meta: 10000,
      },
      {
        id: 'volume-100000',
        nome: '100 Toneladas',
        descricao: 'Acumulou 100.000 kg — lendário',
        icone: Trophy,
        cor: 'yellow',
        desbloqueado: totalVolume >= 100000,
        progresso: Math.min(totalVolume, 100000),
        meta: 100000,
      },
      {
        id: 'horas-10',
        nome: '10 Horas',
        descricao: 'Acumulou 10 horas de treino',
        icone: Calendar,
        cor: 'cyan',
        desbloqueado: totalMinutos >= 600,
        progresso: Math.min(totalMinutos, 600),
        meta: 600,
      },
      {
        id: 'horas-100',
        nome: '100 Horas',
        descricao: 'Acumulou 100 horas de treino',
        icone: Calendar,
        cor: 'teal',
        desbloqueado: totalMinutos >= 6000,
        progresso: Math.min(totalMinutos, 6000),
        meta: 6000,
      },
      {
        id: 'kb-explorer',
        nome: 'Explorador KB',
        descricao: 'Usou 10 exercícios diferentes do kettlebell',
        icone: Target,
        cor: 'emerald',
        desbloqueado: exerciciosKB.size >= 10,
        progresso: Math.min(exerciciosKB.size, 10),
        meta: 10,
      },
      {
        id: 'kb-master',
        nome: 'Mestre KB',
        descricao: 'Usou 30 exercícios diferentes do kettlebell',
        icone: Award,
        cor: 'purple',
        desbloqueado: exerciciosKB.size >= 30,
        progresso: Math.min(exerciciosKB.size, 30),
        meta: 30,
      },
      {
        id: 'variety-pack',
        nome: 'Versátil',
        descricao: 'Treinou 5+ tipos diferentes de sessão',
        icone: Zap,
        cor: 'amber',
        desbloqueado: tiposFeitos.size >= 5,
        progresso: Math.min(tiposFeitos.size, 5),
        meta: 5,
      },
      {
        id: 'consistency',
        nome: 'Constante',
        descricao: 'Treinou 20+ dias diferentes',
        icone: Heart,
        cor: 'rose',
        desbloqueado: new Set(sessoesArr.map((s) => new Date(s.data).toISOString().slice(0, 10))).size >= 20,
        progresso: Math.min(new Set(sessoesArr.map((s) => new Date(s.data).toISOString().slice(0, 10))).size, 20),
        meta: 20,
      },
      {
        id: 'forte',
        nome: 'Forte',
        descricao: 'Bateu 200+ RPE médio numa sessão',
        icone: Dumbbell,
        cor: 'rose',
        desbloqueado: sessoesArr.some((s) => Number(s.rpeMedio || 0) >= 8),
        progresso: sessoesArr.some((s) => Number(s.rpeMedio || 0) >= 8) ? 1 : 0,
        meta: 1,
      },
      {
        id: 'leve',
        nome: 'Recuperando',
        descricao: 'Sessão com RPE ≤ 4 (recuperação ativa)',
        icone: Heart,
        cor: 'blue',
        desbloqueado: sessoesArr.some((s) => Number(s.rpeMedio || 0) > 0 && Number(s.rpeMedio || 0) <= 4),
        progresso: sessoesArr.some((s) => Number(s.rpeMedio || 0) > 0 && Number(s.rpeMedio || 0) <= 4) ? 1 : 0,
        meta: 1,
      },
      {
        id: 'elite',
        nome: 'Elite 50+',
        descricao: 'Streak 100 dias — você é o sonho',
        icone: Crown,
        cor: 'amber',
        desbloqueado: streakAtual >= 100,
        progresso: Math.min(streakAtual, 100),
        meta: 100,
        bloqueadoMsg: `${streakAtual}/100 dias`,
      },
    ];
  }, [sessoes]);

  // Stats
  const stats = useMemo(() => {
    const desbloqueados = badges.filter((b) => b.desbloqueado).length;
    return {
      desbloqueados,
      total: badges.length,
      percentual: Math.round((desbloqueados / badges.length) * 100),
    };
  }, [badges]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8 text-amber-400" />
          Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          Conquistas desbloqueadas automaticamente conforme você treina.
        </p>
      </div>

      {/* PROGRESSO GERAL */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm text-muted-foreground">Progresso total</div>
              <div className="text-3xl font-bold text-amber-400">
                {stats.desbloqueados} / {stats.total}
              </div>
            </div>
            <Trophy className="h-16 w-16 text-amber-400/30" />
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
              style={{ width: `${stats.percentual}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {stats.percentual}% do caminho completo
          </div>
        </CardContent>
      </Card>

      {/* GRID DE BADGES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}

interface BadgeCardProps {
  badge: Badge;
}

const CORES_MAP: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = badge.icone;
  const cor = CORES_MAP[badge.cor] || CORES_MAP.amber;
  const progressoPct = badge.meta && badge.progresso !== undefined
    ? Math.min(100, (badge.progresso / badge.meta) * 100)
    : 0;

  return (
    <Card className={`relative overflow-hidden ${
      badge.desbloqueado
        ? `${cor.border} ${cor.bg}`
        : 'opacity-60 grayscale'
    }`}>
      {!badge.desbloqueado && (
        <div className="absolute top-2 right-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-4 text-center">
        <div className={`inline-flex p-3 rounded-full ${badge.desbloqueado ? cor.bg : 'bg-muted'} mb-3`}>
          <Icon className={`h-8 w-8 ${badge.desbloqueado ? cor.text : 'text-muted-foreground'}`} />
        </div>
        <div className="font-semibold text-sm mb-1">{badge.nome}</div>
        <div className="text-xs text-muted-foreground mb-2 min-h-[2.5em]">
          {badge.descricao}
        </div>
        {badge.desbloqueado ? (
          <Badge className={`${cor.bg} ${cor.text} border ${cor.border}`}>
            ✅ Desbloqueado
          </Badge>
        ) : badge.progresso !== undefined && badge.meta !== undefined ? (
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {badge.bloqueadoMsg || `${badge.progresso}/${badge.meta}`}
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 ${cor.bg.replace('/10', '/50')}`}
                style={{ width: `${progressoPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
