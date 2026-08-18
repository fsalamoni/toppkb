import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminListAdmins, adminGrantAdmin, adminRevokeAdmin } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { Plus, Trash2, Shield, Mail, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminUsers() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const load = async () => {
    setLoading(true);
    try {
      const items = await adminListAdmins();
      setAdmins(items);
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setGranting(true);
    try {
      await adminGrantAdmin(email.trim(), 'admin');
      addToast({ type: 'success', message: `${email} agora é admin` });
      setEmail('');
      await load();
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro: ' + e.message });
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (e: string) => {
    if (!confirm(`Revogar admin de ${e}?`)) return;
    try {
      await adminRevokeAdmin(e);
      addToast({ type: 'success', message: 'Admin revogado' });
      await load();
    } catch (err: any) {
      addToast({ type: 'error', message: 'Erro: ' + err.message });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Admins</h1>
        <p className="text-sm text-muted-foreground">Promova ou revogue admins da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar admin</CardTitle>
          <CardDescription>O usuário precisa já ter uma conta (login).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGrant} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
            <Button type="submit" disabled={granting || !email.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Promover
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admins atuais</CardTitle>
          <CardDescription>{admins.length} cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum admin</p>
          ) : (
            <div className="space-y-2">
              {admins.map((a) => (
                <div key={a.uid} className="flex items-center justify-between border border-border rounded p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {a.role === 'master' ? <Shield className="h-4 w-4 text-yellow-500" /> : <UserCheck className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{a.displayName || a.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {a.email}
                        <Badge variant={a.role === 'master' ? 'default' : 'secondary'}>{a.role}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.grantedAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(a.grantedAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                    {a.role !== 'master' && (
                      <Button variant="ghost" size="icon" onClick={() => handleRevoke(a.email)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsers;
