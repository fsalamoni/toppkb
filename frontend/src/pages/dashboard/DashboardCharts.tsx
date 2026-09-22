/**
 * DashboardCharts — gráficos de evolução do Dashboard.
 *
 * 3 gráficos em grid:
 * 1. Peso histórico (SparklineChart)
 * 2. Sono histórico (SparklineChart)
 * 3. V/D/E 30 dias (MiniBarChart)
 *
 * Cada um tem empty state elegante quando não há dados.
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklineChart, MiniBarChart } from '@/components/charts/SparklineChart';

interface ChartsProps {
  pesoHistorico: Array<{ date: string; value: number }>;
  sonoHistorico: Array<{ date: string; value: number }>;
  vitoriaDerrota30d: { v: number; d: number; e: number };
  sonoMedio: number | null;
}

export function DashboardCharts({
  pesoHistorico,
  sonoHistorico,
  vitoriaDerrota30d,
  sonoMedio,
}: ChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Peso histórico */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">📈 Peso (últimas pesagens)</CardTitle>
            <Link to="/app/peso" className="text-xs text-muted-foreground hover:text-foreground">
              ver →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pesoHistorico.length > 0 ? (
            <>
              <SparklineChart
                data={pesoHistorico.map((p) => ({ date: p.date, value: p.value }))}
                color="cyan"
                height={70}
                showLabels
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Min: {Math.min(...pesoHistorico.map((p) => p.value)).toFixed(1)}kg</span>
                <span>Max: {Math.max(...pesoHistorico.map((p) => p.value)).toFixed(1)}kg</span>
              </div>
            </>
          ) : (
            <div className="h-[70px] flex items-center justify-center text-xs text-muted-foreground">
              Sem pesagens ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sono histórico */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">😴 Sono (últimas noites)</CardTitle>
            <Link to="/app/sono" className="text-xs text-muted-foreground hover:text-foreground">
              ver →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sonoHistorico.length > 0 ? (
            <>
              <SparklineChart
                data={sonoHistorico.map((s) => ({ date: s.date, value: s.value }))}
                color="purple"
                height={70}
                yMin={0}
                yMax={12}
                showLabels
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Meta: 7-9h</span>
                <span>Atual: {sonoMedio?.toFixed(1)}h</span>
              </div>
            </>
          ) : (
            <div className="h-[70px] flex items-center justify-center text-xs text-muted-foreground">
              Sem registros ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* V/D/E 30 dias */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">🏆 Partidas (30d)</CardTitle>
            <Link to="/app/partidas" className="text-xs text-muted-foreground hover:text-foreground">
              ver →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <MiniBarChart
            data={[
              { label: 'V', value: vitoriaDerrota30d.v, color: 'green' },
              { label: 'D', value: vitoriaDerrota30d.d, color: 'red' },
              { label: 'E', value: vitoriaDerrota30d.e, color: 'gray' },
            ]}
            className="h-[70px]"
          />
          <div className="text-center text-xs text-muted-foreground mt-2">
            {vitoriaDerrota30d.v + vitoriaDerrota30d.d + vitoriaDerrota30d.e} partidas
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
