import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { exportarTudo, deletarConta } from '@/lib/api';
import { User, LogOut, Download, Trash2, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Configuracoes() {
  const { user, userDoc, signOut } = useAuth();
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportarTudo({});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toppkb-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Dados exportados!', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza? Esta ação é IRREVERSÍVEL. Todos os seus dados serão deletados.')) return;
    if (!confirm('Última chance: confirmar exclusão da conta?')) return;
    setLoading(true);
    try {
      await deletarConta({});
      await signOut();
      toast({ title: 'Conta deletada', variant: 'success' });
      navigate('/login');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">⚙️ Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/configuracoes/perfil">
              <User className="h-4 w-4" /> Editar perfil
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4" /> Claro
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4" /> Escuro
          </Button>
          <Button
            variant={theme === 'auto' ? 'default' : 'outline'}
            onClick={() => setTheme('auto')}
          >
            Auto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seus dados (LGPD)</CardTitle>
          <CardDescription>Exporte ou delete seus dados a qualquer momento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={handleExport} disabled={loading} variant="outline" className="w-full">
            <Download className="h-4 w-4" /> Exportar tudo (JSON)
          </Button>
          <Button onClick={handleDelete} disabled={loading} variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4" /> Deletar conta e todos os dados
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sobre</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>Top Pickleball 50+ — v0.1.0</div>
          <div>Usuário: {userDoc?.displayName}</div>
          <div>Peso meta: {userDoc?.pesoMeta}kg</div>
          <div>Objetivo: {userDoc?.objetivoFinal}</div>
        </CardContent>
      </Card>
    </div>
  );
}
