/**
 * AchievementsPage — Sprint 77
 * Mostra todas as medalhas/conquistas do usuário.
 */

import { useState, useEffect, useMemo } from 'react';
import { Trophy, Sparkles, Award, Crown, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getAllMedals,
  checkNewAchievements,
  resetAchievements,
  type MedalTier,
} from '@/lib/achievements';
import { useUIStore } from '@/stores/uiStore';

const TIER_COLORS: Record<MedalTier, { bg: string; border: string; text: string; ring: string }> = {
  bronze: {
    bg: 'bg-amber-700/10',
    border: 'border-amber-700/50',
    text: 'text-amber-700',
    ring: 'ring-amber-700/20',
  },
  silver: {
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/50',
    text: 'text-slate-300',
    ring: 'ring-slate-400/20',
  },
  gold: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    ring: 'ring-yellow-500/30',
  },
  platinum: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    ring: 'ring-purple-500/30',
  },
};

const TIER_ICONS: Record<MedalTier, React.ComponentType<{ className?: string }>> = {
  bronze: Award,
  silver: Trophy,
  gold: Crown,
  platinum: Sparkles,
};

export function Achievements() {
  const [refresh, setRefresh] = useState(0);
  const addToast = useUIStore((s) => s.addToast);

  // Check for new achievements
  const newOnes = useMemo(() => checkNewAchievements(), []);
  const allMedals = useMemo(() => getAllMedals(), [refresh]);

  // Show toast for new
  useEffect(() => {
    if (newOnes.length > 0) {
      addToast({
        type: 'success',
        message: `🎉 ${newOnes.length} nova(s) conquista(s)! Veja em Achievements.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const g: Record<MedalTier, typeof allMedals> = { bronze: [], silver: [], gold: [], platinum: [] };
    for (const m of allMedals) {
      g[m.tier].push(m);
    }
    return g;
  }, [allMedals]);

  const totalUnlocked = allMedals.filter((m) => m.unlocked).length;
  const totalMedals = allMedals.length;
  const completion = (totalUnlocked / totalMedals) * 100;

  const handleReset = () => {
    if (!confirm('Resetar todas as conquistas? Isso só afeta a visualização local.')) return;
    resetAchievements();
    setRefresh((r) => r + 1);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Conquistas
          </h1>
          <p className="text-sm text-muted-foreground">
            Desbloqueie medalhas conforme usa o app
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Resetar
        </button>
      </div>

      {/* PROGRESSO GERAL */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border-yellow-500/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {totalUnlocked} de {totalMedals} conquistas
            </span>
            <span className="text-sm font-bold text-yellow-400">
              {completion.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-purple-500 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* MEDALHAS POR TIER */}
      {(['platinum', 'gold', 'silver', 'bronze'] as MedalTier[]).map((tier) => {
        const medals = grouped[tier];
        if (medals.length === 0) return null;
        const unlockedInTier = medals.filter((m) => m.unlocked).length;

        return (
          <div key={tier}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={cn('text-base font-bold uppercase tracking-wide flex items-center gap-2', TIER_COLORS[tier].text)}>
                {(() => {
                  const Icon = TIER_ICONS[tier];
                  return <Icon className="h-4 w-4" />;
                })()}
                {tier}
              </h2>
              <span className="text-xs text-muted-foreground">
                {unlockedInTier}/{medals.length}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {medals.map((m) => {
                const colors = TIER_COLORS[m.tier];

                return (
                  <Card
                    key={m.id}
                    className={cn(
                      'transition-all',
                      m.unlocked
                        ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
                        : 'opacity-50 grayscale',
                    )}
                  >
                    <CardContent className="p-3 text-center space-y-2">
                      <div className="text-4xl">{m.unlocked ? m.emoji : '🔒'}</div>
                      <div>
                        <div className={cn('text-sm font-bold', m.unlocked ? colors.text : 'text-muted-foreground')}>
                          {m.titulo}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {m.descricao}
                        </div>
                      </div>
                      {!m.unlocked && (
                        <div className="text-xs text-muted-foreground italic">
                          Bloqueada
                        </div>
                      )}
                      {m.unlocked && m.unlockedAt && (
                        <div className="text-xs text-emerald-400">
                          ✓ Desbloqueada
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* MOTIVATION */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-blue-400">
            <Flame className="h-4 w-4" />
            Continue conquistando
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-100 space-y-1">
          <p>Cada medalha representa uma forma de usar o app:</p>
          <ul className="list-disc list-inside text-xs space-y-1 ml-2">
            <li><strong>Bronze:</strong> comece a usar — basta entrar em 1 exercício</li>
            <li><strong>Silver:</strong> use regularmente (semanalmente)</li>
            <li><strong>Gold:</strong> domine o app (1 mês de hábito)</li>
            <li><strong>Platinum:</strong> torne-se expert (100% dos exercícios)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
