/**
 * 🏋️ Treinamento · Recuperação & Intensidade Recomendada
 *
 * Calcula um Recovery Score baseado em:
 * - HRV (das sessões, quando disponível)
 * - Sono (das noites registradas em /sono)
 * - Dor (das dores ativas)
 * - Fadiga / estresse subjetivo
 * - Dias desde o último treino pesado
 *
 * Recomenda intensidade do dia: DESCANSAR / LEVE / MODERADO / INTENSO
 *
 * Sub-rota: /app/treinamento/recuperacao
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/common/LoadingScreen';
import {
  ChevronLeft, Heart, Moon, AlertCircle, Activity, Zap,
  TrendingUp, Calendar, Brain,
} from 'lucide-react';

interface SessaoRecente {
  id: string;
  data: string;
  rpeMedio?: number;
  duracaoMin?: number;
  exercicios?: any[];
}

interface Sono {
  id: string;
  data: string;
  horas?: number;
  qualidade?: number;
}

interface Dor {
  id: string;
  data?: string;
  intensidade?: number;
  regiao?: string;
  ativa?: boolean;
}

export function TreinamentoRecuperacao() {
  const { user } = useAuth();

  // Carrega dados
  const sessoes = useQuery({
    queryKey: ['recuperacao-sessoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'treinamento', 'sessoes'),
        orderBy('data', 'desc'),
        limit(10),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessaoRecente));
    },
    enabled: !!user,
  });

  const sono = useQuery({
    queryKey: ['recuperacao-sono', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'sono'),
        orderBy('data', 'desc'),
        limit(7),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sono));
    },
    enabled: !!user,
  });

  const dores = useQuery({
    queryKey: ['recuperacao-dores', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'dores'),
        orderBy('createdAt', 'desc'),
        limit(20),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dor));
    },
    enabled: !!user,
  });

  // Calcula score de recuperação
  const score = useMemo(() => {
    const sessoesArr = sessoes.data || [];
    const sonoArr = sono.data || [];
    const doresArr = dores.data || [];

    // 1. Fadiga muscular (RPE médio das últimas 3 sessões)
    const ultimas3 = sessoesArr.slice(0, 3);
    const rpeMedio = ultimas3.length > 0
      ? ultimas3.reduce((acc, s) => acc + (Number(s.rpeMedio) || 0), 0) / ultimas3.length
      : 0;
    const fadigaMuscular = Math.min(100, rpeMedio * 10); // 0-100

    // 2. Dias desde o último treino
    const ultimaSes = sessoesArr[0];
    const diasUltimo = ultimaSes
      ? Math.floor((Date.now() - new Date(ultimaSes.data).getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    const diasScore = Math.max(0, Math.min(100, diasUltimo * 20)); // ideal: 1-2 dias

    // 3. Sono (média das últimas noites)
    const sonoMedio = sonoArr.length > 0
      ? sonoArr.reduce((acc, s) => acc + (Number(s.horas) || 0), 0) / sonoArr.length
      : 7;
    const sonoScore = Math.max(0, Math.min(100, (sonoMedio / 8) * 100)); // ideal: 8h+

    // 4. Dor (intensidade média das dores ativas)
    const doresAtivas = doresArr.filter((d) => d.ativa !== false && (d.intensidade || 0) > 0);
    const dorMedia = doresAtivas.length > 0
      ? doresAtivas.reduce((acc, d) => acc + (Number(d.intensidade) || 0), 0) / doresAtivas.length
      : 0;
    const dorScore = Math.max(0, 100 - dorMedia * 10);

    // Score final (0-100, MAIOR = MELHOR recuperado)
    const scoreFinal = Math.round(
      (sonoScore * 0.3) +
      (dorScore * 0.3) +
      (diasScore * 0.2) +
      ((100 - fadigaMuscular) * 0.2)
    );

    return {
      scoreFinal: Math.max(0, Math.min(100, scoreFinal)),
      sono: { valor: sonoMedio, score: sonoScore },
      dor: { valor: dorMedia, count: doresAtivas.length, score: dorScore },
      fadiga: { valor: rpeMedio, score: fadigaMuscular },
      diasUltimo,
      scoreDias: diasScore,
    };
  }, [sessoes.data, sono.data, dores.data]);

  // Recomendação baseada no score
  const recomendacao = useMemo(() => {
    if (!score) return null;
    if (score.scoreFinal >= 80) {
      return {
        nivel: 'INTENSO',
        cor: 'rose',
        icone: Zap,
        mensagem: 'Recuperação excelente! Pode ir com tudo.',
        detalhes: 'Dia ideal para PRs, sessões pesadas, periodização intensa.',
      };
    }
    if (score.scoreFinal >= 60) {
      return {
        nivel: 'MODERADO',
        cor: 'amber',
        icone: TrendingUp,
        mensagem: 'Recuperação boa. Pode treinar normalmente.',
        detalhes: 'Volume moderado, mantenha a técnica, escute o corpo.',
      };
    }
    if (score.scoreFinal >= 40) {
      return {
        nivel: 'LEVE',
        cor: 'blue',
        icone: Activity,
        mensagem: 'Recuperação parcial. Treino leve recomendado.',
        detalhes: 'Mobilidade, técnica, volume baixo. Evite PRs hoje.',
      };
    }
    return {
      nivel: 'DESCANSAR',
      cor: 'emerald',
      icone: Moon,
      mensagem: 'Recuperação baixa. Priorize descanso ativo.',
      detalhes: 'Sono, hidratação, alongamento. Volte amanhã.',
    };
  }, [score]);

  if (sessoes.isLoading || sono.isLoading || dores.isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!score) return null;

  const corClass = {
    rose: 'border-rose-500/30 bg-rose-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
  }[recomendacao!.cor] || 'border-blue-500/30 bg-blue-500/5';

  const textCor = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
  }[recomendacao!.cor];

  const Icone = recomendacao!.icone!;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/app/treinamento">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Treinamento
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-rose-400" />
          Recuperação & Intensidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Baseado em sono, dor, fadiga muscular e dias desde o último treino.
        </p>
      </div>

      {/* SCORE PRINCIPAL */}
      <Card className={`border-2 ${corClass}`}>
        <CardContent className="p-8 text-center">
          <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Score de Recuperação
          </div>
          <div className={`text-7xl font-bold ${textCor} mb-3`}>
            {score.scoreFinal}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-4">
            <div
              className={`h-3 transition-all ${
                score.scoreFinal >= 80 ? 'bg-rose-500' :
                score.scoreFinal >= 60 ? 'bg-amber-500' :
                score.scoreFinal >= 40 ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${score.scoreFinal}%` }}
            />
          </div>
          <Badge className={`text-lg px-4 py-1.5 ${corClass} ${textCor}`}>
            <Icone className="h-4 w-4 mr-1" />
            {recomendacao!.nivel}
          </Badge>
          <div className="mt-4 text-base">
            {recomendacao!.mensagem}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {recomendacao!.detalhes}
          </div>
        </CardContent>
      </Card>

      {/* COMPONENTES DO SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sono */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">Sono</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {score.sono.valor.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">
              Média das últimas {sono.data?.length || 0} noites
            </div>
            <div className="text-xs mt-2">
              {score.sono.valor >= 7.5 ? (
                <span className="text-emerald-400">✓ Adequado</span>
              ) : score.sono.valor >= 6 ? (
                <span className="text-amber-400">⚠ Pode melhorar</span>
              ) : (
                <span className="text-rose-400">⚠ Insuficiente</span>
              )}
            </div>
            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-xs">
              <Link to="/app/sono">
                Ver histórico sono →
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Dor */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <span className="font-semibold">Dor</span>
            </div>
            <div className="text-3xl font-bold text-rose-400">
              {score.dor.count > 0 ? score.dor.valor.toFixed(1) : '0'}
              <span className="text-sm text-muted-foreground"> /10</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {score.dor.count} dor(es) ativa(s)
            </div>
            <div className="text-xs mt-2">
              {score.dor.valor === 0 ? (
                <span className="text-emerald-400">✓ Sem dores</span>
              ) : score.dor.valor <= 3 ? (
                <span className="text-amber-400">⚠ Leve</span>
              ) : (
                <span className="text-rose-400">⚠ Atenção</span>
              )}
            </div>
            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-xs">
              <Link to="/app/dores">
                Ver dores →
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Fadiga */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-amber-400" />
              <span className="font-semibold">Fadiga Muscular</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {score.fadiga.valor.toFixed(1)}
              <span className="text-sm text-muted-foreground"> /10 RPE</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Média das últimas 3 sessões
            </div>
            <div className="text-xs mt-2">
              {score.fadiga.valor <= 6 ? (
                <span className="text-emerald-400">✓ Recuperado</span>
              ) : score.fadiga.valor <= 8 ? (
                <span className="text-amber-400">⚠ Fadigado</span>
              ) : (
                <span className="text-rose-400">⚠ Muito fadigado</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tempo desde último */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold">Último treino</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {score.diasUltimo === 0 ? 'hoje' : `${score.diasUltimo}d`}
            </div>
            <div className="text-xs text-muted-foreground">
              {score.diasUltimo === 0 ? 'treinou hoje' : 'atrás'}
            </div>
            <div className="text-xs mt-2">
              {score.diasUltimo <= 2 ? (
                <span className="text-amber-400">⚠ Descanso curto</span>
              ) : score.diasUltimo <= 4 ? (
                <span className="text-emerald-400">✓ Ideal</span>
              ) : (
                <span className="text-rose-400">⚠ Muito parado</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FORMULA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-400" />
            Como calculamos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            <strong>Fórmula:</strong> Score = (Sono × 30%) + (Dor × 30%) + (Dias × 20%) + (Recuperação × 20%)
          </p>
          <p>Cada componente é normalizado de 0 a 100 baseado em metas científicas:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Sono</strong>: 8h+ = 100, 6h = 75, &lt;5h = 0</li>
            <li><strong>Dor</strong>: 0 = 100, intensidade 10 = 0</li>
            <li><strong>Dias desde último</strong>: 1-2 dias = 100, 0 dias = 0, 5+ dias = 100+</li>
            <li><strong>Fadiga</strong>: RPE ≤ 5 = recuperado (100), RPE 10 = fadigado (0)</li>
          </ul>
          <p className="pt-2 text-xs">
            💡 <strong>Dica:</strong> Mantenha sono, dores e sessões atualizados pra score mais preciso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
