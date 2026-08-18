import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { adminGetPlatformStats } from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';
import { Users, MessageSquare, Activity, AlertCircle } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetPlatformStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!stats) return <div>Sem dados</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard titulo="Usuários" valor={stats.totalUsers} icone={<Users className="h-5 w-5" />} />
        <StatCard titulo="Admins" valor={stats.totalAdmins} icone={<Users className="h-5 w-5" />} />
        <StatCard titulo="Conversas" valor={stats.totalConversas} icone={<MessageSquare className="h-5 w-5" />} />
        <StatCard titulo="Mensagens" valor={stats.totalMensagens} icone={<MessageSquare className="h-5 w-5" />} />
        <StatCard titulo="Ativos 7d" valor={stats.usuariosAtivos7d} descricao={`${((stats.usuariosAtivos7d / Math.max(stats.totalUsers, 1)) * 100).toFixed(0)}% do total`} icone={<Activity className="h-5 w-5" />} />
        <StatCard titulo="Eventos Audit" valor={stats.totalEventosAuditoria} icone={<AlertCircle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros por coleção</CardTitle>
          <CardDescription>Total acumulado no Firestore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(stats.registrosPorColecao || {}).map(([name, value]) => (
              <div key={name} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground capitalize">{name}</p>
                <p className="text-xl font-bold">{value as any}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
