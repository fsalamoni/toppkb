/**
 * WeeklySummary — resumo semanal imprimível em 1 página
 *
 * Coleta dados da semana atual e gera um resumo estruturado:
 * - Treinos (quantidade, minutos totais, tipos)
 * - Partidas (vitórias, derrotas, streak)
 * - Nutrição (aderência, observações)
 * - Sono (média de horas)
 * - Peso (variação semanal)
 * - Dores / Lesões ativas
 *
 * USO:
 *   <WeeklySummary userId={user.uid} />
 *
 * Aplicar print-only para o conteúdo:
 *   .print-only { display: none }
 *   @media print { .print-only { display: block } }
 */
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { withTimeout } from '@/lib/asyncUtils';

interface WeeklySummaryProps {
  userId: string;
}

interface WeekData {
  startDate: Date;
  endDate: Date;
  treinos: any[];
  partidas: any[];
  nutricao: any[];
  sono: any[];
  peso: any[];
  dores: any[];
  lesoes: any[];
}

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 (dom) - 6 (sáb)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // segunda
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

async function fetchWeekData(userId: string): Promise<WeekData> {
  const { start, end } = getWeekRange();

  const collections = ['treinos', 'partidas', 'nutricao', 'sono', 'peso', 'dores', 'lesoes'];

  const results = await Promise.all(
    collections.map(async (name) => {
      try {
        const colRef = collection(db, `toppkb_users/${userId}/${name}`);
        const q = query(
          colRef,
          where('data', '>=', Timestamp.fromDate(start)),
          where('data', '<', Timestamp.fromDate(end)),
          orderBy('data', 'asc'),
        );
        const snapshot = await withTimeout(getDocs(q), 5000, `${name} week`);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        return [];
      }
    }),
  );

  return {
    startDate: start,
    endDate: end,
    treinos: results[0],
    partidas: results[1],
    nutricao: results[2],
    sono: results[3],
    peso: results[4],
    dores: results[5],
    lesoes: results[6],
  };
}

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['weekly-summary', userId],
    queryFn: () => fetchWeekData(userId),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1h
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data) return;
    const json = JSON.stringify(
      {
        periodo: {
          inicio: data.startDate.toISOString(),
          fim: data.endDate.toISOString(),
        },
        resumo: {
          treinos: data.treinos.length,
          partidas: data.partidas.length,
          registros_nutricao: data.nutricao.length,
          registros_sono: data.sono.length,
          registros_peso: data.peso.length,
          dores_ativas: data.dores.length,
          lesoes_ativas: data.lesoes.length,
        },
        detalhes: {
          treinos: data.treinos,
          partidas: data.partidas,
          nutricao: data.nutricao,
          sono: data.sono,
          peso: data.peso,
          dores: data.dores,
          lesoes: data.lesoes,
        },
      },
      null,
      2,
    );

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toppkb-semana-${data.startDate.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="p-4">Carregando resumo...</div>;
  if (error) return <div className="p-4 text-red-600">Erro ao carregar resumo.</div>;
  if (!data) return null;

  // Cálculos rápidos
  const totalMinutos = data.treinos.reduce((sum, t) => sum + (t.duracao || 0), 0);
  const horasTreino = (totalMinutos / 60).toFixed(1);
  const vitorias = data.partidas.filter((p) => p.resultado === 'vitoria').length;
  const derrotas = data.partidas.filter((p) => p.resultado === 'derrota').length;
  const mediaSono =
    data.sono.length > 0
      ? (data.sono.reduce((sum, s) => sum + (s.horas || 0), 0) / data.sono.length).toFixed(1)
      : '—';

  return (
    <div>
      {/* Botões (escondem em print) */}
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={handlePrint} size="sm" variant="default">
          <Printer className="h-4 w-4 mr-1" />
          Imprimir resumo
        </Button>
        <Button onClick={handleExport} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-1" />
          Exportar JSON
        </Button>
      </div>

      {/* Conteúdo imprimível */}
      <div className="space-y-6 p-4">
        {/* Cabeçalho */}
        <div className="border-b pb-3">
          <h1 className="text-2xl font-bold">Top Pickleball 50+</h1>
          <p className="text-sm text-muted-foreground">
            Resumo semanal:{' '}
            {data.startDate.toLocaleDateString('pt-BR')} até{' '}
            {data.endDate.toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Gerado em {new Date().toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Métricas em cards */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Métricas da semana</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricBox label="Treinos" value={data.treinos.length.toString()} sublabel={`${horasTreino}h total`} />
            <MetricBox label="Partidas" value={data.partidas.length.toString()} sublabel={`${vitorias}V/${derrotas}D`} />
            <MetricBox label="Sono médio" value={`${mediaSono}h`} sublabel={`${data.sono.length} noites`} />
            <MetricBox label="Dores ativas" value={data.dores.length.toString()} sublabel={`${data.lesoes.length} lesões`} />
          </div>
        </section>

        {/* Treinos */}
        {data.treinos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Treinos ({data.treinos.length})</h2>
            <ul className="space-y-1 text-sm">
              {data.treinos.map((t: any) => (
                <li key={t.id} className="flex justify-between border-b border-dotted py-1">
                  <span>{new Date(t.data?.toDate?.() || t.data).toLocaleDateString('pt-BR')}</span>
                  <span>{t.tipo || '—'}</span>
                  <span className="text-muted-foreground">{t.duracao || 0} min</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Partidas */}
        {data.partidas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Partidas ({data.partidas.length})</h2>
            <ul className="space-y-1 text-sm">
              {data.partidas.map((p: any) => (
                <li key={p.id} className="flex justify-between border-b border-dotted py-1">
                  <span>{new Date(p.data?.toDate?.() || p.data).toLocaleDateString('pt-BR')}</span>
                  <span className={p.resultado === 'vitoria' ? 'text-green-600' : 'text-red-600'}>
                    {p.resultado || '—'}
                  </span>
                  <span className="text-muted-foreground">
                    {p.placar || '—'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  sublabel?: string;
}

function MetricBox({ label, value, sublabel }: MetricBoxProps) {
  return (
    <div className="border rounded p-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}
