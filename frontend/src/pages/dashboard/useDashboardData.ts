/**
 * useDashboardData — carregamento de dados + transformações do Dashboard.
 *
 * Centraliza toda a lógica de:
 * - Fetching paralelo com timeout (safeGet)
 * - Ordenação client-side (evita índices)
 * - Cálculo de KPIs (win rate, streak, médias)
 * - Derivação para gráficos (sparklines, bar chart)
 *
 * Extraído do Dashboard.tsx (era 695 linhas) em Sprint 3 para reduzir
 * complexidade do componente e facilitar testes isolados.
 */
import { useQuery } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { differenceInDays, subDays, formatYmd } from '@/lib/utils';

interface DashboardData {
  treinos7d: number;
  partidas7d: number;
  vitoriasTotal: number;
  totalPartidas: number;
  winRate: number;
  streak: number;
  streakType: 'V' | 'D' | null;
  dorAtiva: any | null;
  pesoAtual: number | null;
  sonoMedio: number | null;
  proximoTorneio: { nome: string; diasRestantes: number | null; dataInicio: any } | null;
  ultimosTreinos: any[];
  ultimasPartidas: any[];
  diasAtivos: Set<string>;
  pesoHistorico: Array<{ date: string; value: number }>;
  sonoHistorico: Array<{ date: string; value: number }>;
  vitoriaDerrota30d: { v: number; d: number; e: number };
  hidratacaoHoje: number;
  hidratacaoMeta: number;
}

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

async function loadDashboardData(uid: string): Promise<DashboardData> {
  const agora = new Date();
  const seteDiasAtras = subDays(agora, 7);
  const trintaDiasAtras = subDays(agora, 30);

  // Helper de timeout (Firestore pode demorar com índices faltando)
  const safeGet = async (col: string): Promise<any[]> => {
    try {
      const { getDocs, collection: c } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      return await Promise.race([
        getDocs(c(db, 'toppkb_users', uid, col)).then((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error(`Timeout ${col}`)), 6000)),
      ]);
    } catch (e) {
      console.warn(`[dashboard] ${col} falhou:`, e);
      return [];
    }
  };

  // Carrega todas as coleções em paralelo
  const [treinosRaw, partidasRaw, doresRaw, pesosRaw, sonosRaw, torneiosRaw, hidratacoesRaw] = await Promise.all([
    safeGet('treinos'),
    safeGet('partidas'),
    safeGet('dores'),
    safeGet('peso'),
    safeGet('sono'),
    safeGet('torneios'),
    safeGet('hidratacao'),
  ]);

  const byDataDesc = (field = 'data') => (a: any, b: any) => {
    const da = tsToDate(a[field])?.getTime() ?? 0;
    const dbt = tsToDate(b[field])?.getTime() ?? 0;
    return dbt - da;
  };
  const treinosRawSorted = [...treinosRaw].sort(byDataDesc());
  const partidas = [...partidasRaw].sort(byDataDesc());
  const dores = [...doresRaw].sort(byDataDesc());
  const pesos = [...pesosRaw].sort(byDataDesc());
  const sonos = [...sonosRaw].sort(byDataDesc());
  const hidratacoes = [...hidratacoesRaw].sort(byDataDesc());
  const torneios = [...torneiosRaw].sort((a, b) => {
    const da = tsToDate(a.dataInicio)?.getTime() ?? Infinity;
    const dbt = tsToDate(b.dataInicio)?.getTime() ?? Infinity;
    return da - dbt;
  });

  const treinos = treinosRawSorted;
  const treinos7d = treinos.filter((t: any) => {
    const d = tsToDate(t.data);
    return d && d >= seteDiasAtras;
  }).length;

  const partidas7d = partidas.filter((p: any) => {
    const d = tsToDate(p.data);
    return d && d >= seteDiasAtras;
  }).length;
  const vitoriasTotal = partidas.filter((p: any) => p.resultado === 'vitoria').length;
  const totalPartidas = partidas.length;
  const winRate = partidas.length > 0 ? Math.round((vitoriasTotal / partidas.length) * 100) : 0;

  // Streak
  let streak = 0;
  let streakType: 'V' | 'D' | null = null;
  for (const p of partidas) {
    if (streak === 0) {
      if (p.resultado === 'vitoria') { streak = 1; streakType = 'V'; }
      else if (p.resultado === 'derrota') { streak = 1; streakType = 'D'; }
      else break;
    } else if (streakType === 'V' && p.resultado === 'vitoria') streak++;
    else if (streakType === 'D' && p.resultado === 'derrota') streak++;
    else break;
  }

  const dorAtiva = dores.find((d: any) => d.ativa !== false && (d.intensidade || 0) >= 5) || null;
  const pesoAtual = pesos[0]?.peso ?? null;

  const sonoDocs = sonos.filter((s: any) => s.horasDormidas);
  const sonoMedio = sonoDocs.length > 0
    ? sonoDocs.reduce((acc: number, s: any) => acc + (s.horasDormidas || 0), 0) / sonoDocs.length
    : null;

  const proximoTorneioDoc = torneios.find((t: any) => {
    const di = tsToDate(t.dataInicio);
    return di && di >= agora;
  }) || null;

  const proximoTorneio = proximoTorneioDoc ? {
    nome: proximoTorneioDoc.nome || 'Torneio',
    diasRestantes: differenceInDays(tsToDate(proximoTorneioDoc.dataInicio) || new Date(), new Date()),
    dataInicio: proximoTorneioDoc.dataInicio,
  } : null;

  const diasAtivos = new Set<string>();
  [...treinos, ...partidas].forEach((r: any) => {
    const d = tsToDate(r.data);
    if (d) diasAtivos.add(formatYmd(d));
  });

  const pesoDocs = pesos.filter((p: any) => p.peso);
  const pesoHistorico = pesoDocs
    .map((p: any) => {
      const d = tsToDate(p.data);
      return d ? { date: formatYmd(d), value: p.peso } : null;
    })
    .filter((x: any): x is { date: string; value: number } => x !== null)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(-30);

  const sonoDocsAll = sonos.filter((s: any) => s.horasDormidas);
  const sonoHistorico = sonoDocsAll
    .map((s: any) => {
      const d = tsToDate(s.data);
      return d ? { date: formatYmd(d), value: s.horasDormidas } : null;
    })
    .filter((x: any): x is { date: string; value: number } => x !== null)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(-30);

  const partidas30d = partidas.filter((p: any) => {
    const d = tsToDate(p.data);
    return d && d >= trintaDiasAtras;
  });
  const v30 = partidas30d.filter((p: any) => p.resultado === 'vitoria').length;
  const d30 = partidas30d.filter((p: any) => p.resultado === 'derrota').length;
  const e30 = partidas30d.filter((p: any) => p.resultado === 'empate').length;

  const hidDoc = hidratacoes[0];
  const hidratacaoHoje = hidDoc?.totalMl || 0;
  const hidratacaoMeta = Math.round(80 * 35);

  return {
    treinos7d,
    partidas7d,
    vitoriasTotal,
    totalPartidas,
    winRate,
    streak,
    streakType,
    dorAtiva,
    pesoAtual,
    sonoMedio,
    proximoTorneio,
    ultimosTreinos: treinos.slice(0, 3),
    ultimasPartidas: partidas.slice(0, 3),
    diasAtivos,
    pesoHistorico,
    sonoHistorico,
    vitoriaDerrota30d: { v: v30, d: d30, e: e30 },
    hidratacaoHoje,
    hidratacaoMeta,
  };
}

/**
 * Hook principal do Dashboard.
 *
 * Encapsula useQuery com cache de 60s e retry único (evita Hammer
 * em caso de falhas transitórias do Firestore).
 */
export function useDashboardData(uid: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', uid],
    queryFn: () => loadDashboardData(uid!),
    enabled: !!uid,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export type { DashboardData };
