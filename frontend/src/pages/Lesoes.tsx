import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Heart, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  'em-tratamento': { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-300', label: '🔴 Em tratamento' },
  recuperada: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', label: '✅ Recuperada' },
  cronica: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', label: '🟡 Crônica' },
};

export function Lesoes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lesoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'lesoes'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'lesoes', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesoes', user?.uid] });
      toast.success('Lesão removida');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const lesoes = data || [];
  const emTratamento = lesoes.filter((l: any) => l.status === 'em-tratamento').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lesões</h1>
          <p className="text-sm text-muted-foreground">
            Histórico médico · {lesoes.length} {lesoes.length === 1 ? 'lesão registrada' : 'lesões registradas'}
            {emTratamento > 0 && <span className="ml-2 text-red-600 font-semibold">· {emTratamento} em tratamento</span>}
          </p>
        </div>
        <Button asChild>
          <Link to="/app/lesoes/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova lesão
          </Link>
        </Button>
      </div>

      {lesoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="❤️"
              titulo="Nenhuma lesão registrada"
              descricao="Mantenha histórico médico completo — facilita diagnóstico, recuperação e prevenção de reincidência."
              acao={
                <Button asChild>
                  <Link to="/app/lesoes/nova"><Plus className="mr-2 h-4 w-4" />Registrar</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {lesoes.map((l: any) => {
            const status = STATUS_BADGE[l.status] || STATUS_BADGE['em-tratamento'];
            return (
              <Card key={l.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{l.nome}</h3>
                          <p className="text-xs text-muted-foreground">
                            {l.regiao} · {tsToDate(l.data)?.toLocaleDateString('pt-BR')}
                            {l.dataRecuperacao && ` → ${tsToDate(l.dataRecuperacao)?.toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs px-2 py-1 rounded-md font-medium", status.bg, status.text)}>
                            {status.label}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => del.mutate(l.id)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-md bg-muted">
                          {l.tipo} · {l.gravidade}
                        </span>
                        {l.profissional && (
                          <span className="text-xs px-2 py-1 rounded-md bg-muted">👨‍⚕️ {l.profissional}</span>
                        )}
                        {l.custo > 0 && (
                          <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-700">
                            💰 R$ {l.custo.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {l.tratamento && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          <strong>Tratamento:</strong> {l.tratamento}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/app/lesoes/${l.id}`}
                      className="self-center text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
