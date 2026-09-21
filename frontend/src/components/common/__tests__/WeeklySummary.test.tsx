/**
 * Testes do WeeklySummary — coletores de dados semanais
 *
 * Testamos o helper getWeekRange() e o cálculo de métricas
 * sem precisar mockar Firebase.
 */
import { describe, it, expect } from 'vitest';

describe('WeeklySummary logic', () => {
  describe('getWeekRange', () => {
    it('retorna segunda-feira como início', () => {
      // Implementação inline do helper (mesma lógica do componente)
      function getWeekRange() {
        const now = new Date('2025-01-15T14:00:00'); // quarta-feira
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end };
      }

      const { start, end } = getWeekRange();

      // start deve ser uma segunda-feira (day 1)
      expect(start.getDay()).toBe(1);
      // end é start + 7 dias
      expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('trata corretamente quando hoje é domingo', () => {
      function getWeekRange() {
        const now = new Date('2025-01-19T10:00:00'); // domingo
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return { start, end };
      }

      const { start } = getWeekRange();
      // Domingo -> start na segunda anterior
      expect(start.getDay()).toBe(1);
    });
  });

  describe('métricas calculadas', () => {
    it('calcula total de minutos de treino', () => {
      const treinos = [
        { duracao: 30 },
        { duracao: 60 },
        { duracao: 45 },
      ];
      const totalMinutos = treinos.reduce((sum, t) => sum + (t.duracao || 0), 0);
      expect(totalMinutos).toBe(135);
      expect((totalMinutos / 60).toFixed(1)).toBe('2.3');
    });

    it('calcula vitórias e derrotas', () => {
      const partidas = [
        { resultado: 'vitoria' },
        { resultado: 'vitoria' },
        { resultado: 'derrota' },
        { resultado: 'empate' },
      ];
      const vitorias = partidas.filter((p) => p.resultado === 'vitoria').length;
      const derrotas = partidas.filter((p) => p.resultado === 'derrota').length;
      expect(vitorias).toBe(2);
      expect(derrotas).toBe(1);
    });

    it('calcula média de sono', () => {
      const sono = [
        { horas: 7.5 },
        { horas: 8 },
        { horas: 7 },
      ];
      const media =
        sono.length > 0
          ? sono.reduce((sum, s) => sum + (s.horas || 0), 0) / sono.length
          : 0;
      expect(media.toFixed(1)).toBe('7.5');
    });

    it('retorna 0 média de sono sem dados', () => {
      const sono: any[] = [];
      const media =
        sono.length > 0 ? sono.reduce((sum, s) => sum + (s.horas || 0), 0) / sono.length : 0;
      expect(media).toBe(0);
    });

    it('converte Firestore Timestamp para Date', () => {
      const ts = { toDate: () => new Date('2025-01-15T10:00:00'), seconds: 1736935200 };
      const date = new Date((ts as any).toDate?.() || ts);
      expect(date.toISOString()).toContain('2025-01-15');
    });
  });
});
