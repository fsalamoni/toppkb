import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDashboard } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { TrendingDown, TrendingUp, AlertCircle, Trophy, Target, Scale, Activity } from 'lucide-react';
import { classificarIMC, formatKg } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export function Dashboard() {
  const { userDoc } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['/app/dashboard'],
    queryFn: () => getDashboard({}),
    refetchInterval: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <EmptyState
        icone="⚠️"
        titulo="Não foi possível carregar o dashboard"
        descricao="Tente novamente em alguns instantes."
        acao={<Button onClick={() => window.location.reload()}>Recarregar</Button>}
      />
    );
  }

  const k = data?.kpis;
  if (!k) return null;

  const imcClass = classificarIMC(k.imc);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Bom dia, {userDoc?.displayName} 🏓</h1>
        <p className="text-sm text-muted-foreground">Sua jornada rumo ao topo em 2032</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" /> Peso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKg(k.pesoAtual)}</div>
            <div className={`text-xs flex items-center gap-1 mt-1 ${k.pesoDelta7d < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {k.pesoDelta7d < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {k.pesoDelta7d > 0 ? '+' : ''}{k.pesoDelta7d.toFixed(1)}kg em 7d
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Meta: {formatKg(k.pesoMeta)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> IMC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.imc.toFixed(1)}</div>
            <div className={`text-xs mt-1 ${imcClass.cor}`}>{imcClass.label}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {userDoc?.altura ? `${userDoc.altura}cm` : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Sequência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.diasSemDor}d</div>
            <div className="text-xs text-muted-foreground mt-1">sem dor aguda</div>
            <div className="text-xs text-muted-foreground mt-2">
              Treinos: {k.sequenciaTreinos} seguidos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Esta semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.horasTreinoSemana.toFixed(1)}h</div>
            <div className="text-xs text-muted-foreground mt-1">de treino</div>
            <div className="text-xs text-muted-foreground mt-2">
              Meta: 12-15h/sem
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo IA */}
      {k.resumoIA && (
        <Card>
          <CardHeader>
            <CardTitle>🤖 Resumo da semana</CardTitle>
            <CardDescription>Gerado pela equipe de IA</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{k.resumoIA}</p>
            <Link to="/app/chat" className="text-sm text-primary hover:underline mt-3 inline-block">
              Ver conversa completa →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Próximo torneio */}
      {k.proximoTorneio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Próximo torneio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{k.proximoTorneio.nome}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(k.proximoTorneio.data).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{k.proximoTorneio.diasRestantes}</div>
                <div className="text-xs text-muted-foreground">dias restantes</div>
              </div>
            </div>
            <Link to="/app/torneios" className="text-sm text-primary hover:underline mt-3 inline-block">
              Ver detalhes →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Atalhos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Atalhos rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <Button asChild variant="outline"><Link to="/app/treinos/novo">🏓 Novo treino</Link></Button>
            <Button asChild variant="outline"><Link to="/app/partidas/nova">🎾 Nova partida</Link></Button>
            <Button asChild variant="outline"><Link to="/app/saude/peso">⚖️ Registrar peso</Link></Button>
            <Button asChild variant="outline"><Link to="/app/saude/dores">🩹 Registrar dor</Link></Button>
            <Button asChild variant="outline"><Link to="/app/alimentacao/refeicoes">🥗 Nova refeição</Link></Button>
            <Button asChild variant="outline"><Link to="/app/chat">💬 Falar com IA</Link></Button>
            <Button asChild variant="outline"><Link to="/app/metricas/avaliacoes/nova">📊 Avaliação mensal</Link></Button>
            <Button asChild variant="outline"><Link to="/app/torneios">🏆 Novo torneio</Link></Button>
            <Button asChild variant="outline"><Link to="/app/saude/sono">😴 Registrar sono</Link></Button>
            <Button asChild variant="outline"><Link to="/app/fisico/forca">🏋️ Sessão de força</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
