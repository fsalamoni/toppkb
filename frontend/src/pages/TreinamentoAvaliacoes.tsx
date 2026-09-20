/**
 * 🏋️ Treinamento · Avaliações Físicas Periódicas
 *
 * Lista de avaliações que já existem em `toppkb_users/{uid}/avaliacoes`
 * (criadas pelo AvaliacaoForm existente).
 *
 * Sub-rota: /app/treinamento/avaliacoes
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { formatDate } from '@/lib/utils';

export function TreinamentoAvaliacoes() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['treinamento-avaliacoes', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      // Lê da coleção já existente (compatível com AvaliacaoForm.tsx)
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'avaliacoes'),
        orderBy('dataPreenchimento', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/app/treinamento">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Treinamento
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-cyan-400" />
            Avaliações Físicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Snapshots periódicos de força, mobilidade e composição corporal.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/avaliacao">
            <Plus className="h-4 w-4 mr-1" />
            Nova Avaliação
          </Link>
        </Button>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((av: any) => (
            <Card key={av.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="font-semibold">
                    {av.mes ? `Avaliação ${av.mes}` : formatDate(av.data || av.dataPreenchimento)}
                  </div>
                  {av.notaGeral && (
                    <Badge variant="outline">⭐ Nota {av.notaGeral}/10</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {av.peso && (
                    <div>
                      <div className="text-xs text-muted-foreground">Peso</div>
                      <div className="font-bold">{av.peso} kg</div>
                    </div>
                  )}
                  {av.imc && (
                    <div>
                      <div className="text-xs text-muted-foreground">IMC</div>
                      <div className="font-bold">{av.imc.toFixed(1)}</div>
                    </div>
                  )}
                  {av.horasTreino && (
                    <div>
                      <div className="text-xs text-muted-foreground">Horas/mês</div>
                      <div className="font-bold">{av.horasTreino}h</div>
                    </div>
                  )}
                  {av.jogosMes && (
                    <div>
                      <div className="text-xs text-muted-foreground">Jogos</div>
                      <div className="font-bold">{av.jogosMes}</div>
                    </div>
                  )}
                </div>
                {av.maiorConquista && (
                  <div className="text-sm text-muted-foreground mt-3">
                    🏆 <strong>Maior conquista:</strong> {av.maiorConquista}
                  </div>
                )}
                {av.maiorDificuldade && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ⚠️ <strong>Maior dificuldade:</strong> {av.maiorDificuldade}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icone="📊"
          titulo="Nenhuma avaliação registrada"
          descricao="Use o formulário de avaliação mensal para acompanhar evolução"
        />
      )}
    </div>
  );
}

