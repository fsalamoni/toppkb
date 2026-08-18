import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2 } from 'lucide-react';
import { formatDateTime, formatKg } from '@/lib/utils';
import type { Treino } from '@/lib/api';

export function TreinosList() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/app/treinos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'users', user.uid, '/app/treinos'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Treino));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, '/app/treinos', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/app/treinos'] });
      toast({ title: 'Treino removido', variant: 'success' });
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏓 Treinos</h1>
        <Button asChild><Link to="/app/treinos/novo"><Plus className="h-4 w-4" /> Novo treino</Link></Button>
      </div>

      {data && data.length === 0 ? (
        <EmptyState
          icone="🏓"
          titulo="Nenhum treino registrado"
          descricao="Comece registrando seu primeiro treino!"
          acao={<Button asChild><Link to="/app/treinos/novo">Registrar treino</Link></Button>}
        />
      ) : (
        <div className="space-y-2">
          {data?.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{t.tipo}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{t.duracaoMin}min</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs">Intensidade {t.intensidade}/10</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(t.data)} • {t.local}
                    </div>
                    {t.drillsRealizados && t.drillsRealizados.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.drillsRealizados.map((d) => (
                          <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.oQueFuncionou && (
                      <div className="text-sm mt-2">
                        <span className="text-green-500">✓ </span>{t.oQueFuncionou}
                      </div>
                    )}
                    {t.oQueMelhorar && (
                      <div className="text-sm">
                        <span className="text-yellow-500">→ </span>{t.oQueMelhorar}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => t.id && del.mutate(t.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
