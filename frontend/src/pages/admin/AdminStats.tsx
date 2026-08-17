import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChartCard, PieChartCard } from '@/components/dashboard/LineChartCard';
import { adminGetPlatformStats } from '@/lib/api';
import { Users, MessageSquare, AlertCircle, FileText, Activity, TrendingUp } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function AdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    adminGetPlatformStats()
      .then(setStats)
      .catch((e) => addToast({ type: 'error', message: 'Erro: ' + e.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!stats) return <p>Sem dados disponíveis</p>;

  const registrosData = Object.entries(stats.registrosPorColecao || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas da Plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Atualizado em: {new Date(stats.atualizadoEm).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          titulo="Usuários"
          valor={stats.totalUsers}
          icone={<Users className="h-5 w-5" />}
        />
        <StatCard
          titulo="Admins"
          valor={stats.totalAdmins}
          icone={<Activity className="h-5 w-5" />}
        />
        <StatCard
          titulo="Conversas"
          valor={stats.totalConversas}
          icone={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          titulo="Mensagens"
          valor={stats.totalMensagens}
          icone={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          titulo="Ativos 7d"
          valor={stats.usuariosAtivos7d}
          descricao={`${((stats.usuariosAtivos7d / Math.max(stats.totalUsers, 1)) * 100).toFixed(0)}% do total`}
          icone={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          titulo="Eventos Audit"
          valor={stats.totalEventosAuditoria}
          icone={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <BarChartCard
          title="Registros por coleção"
          data={registrosData}
          dataKey="value"
          color="#3b82f6"
        />
        <PieChartCard
          title="Distribuição"
          data={registrosData}
          dataKey="value"
        />
      </div>
    </div>
  );
}

export default AdminStats;
