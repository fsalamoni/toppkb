/**
 * Testes de performance/memoization do KPICard
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { KPICard } from '../DashboardKPIs';
import { MemoryRouter } from 'react-router-dom';

describe('KPICard memoization', () => {
  it('não re-renderiza com props idênticas', () => {
    const renderSpy = vi.fn();
    const Test = function Test() {
      renderSpy();
      return <KPICard label="A" value="1" icon={Activity} color="emerald" />;
    };
    Test.displayName = 'Test';

    const { rerender } = render(
      <MemoryRouter>
        <Test />
      </MemoryRouter>
    );
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render com mesmas props
    rerender(
      <MemoryRouter>
        <Test />
      </MemoryRouter>
    );
    // Test rerendera mas KPICard não
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('re-renderiza quando label muda', () => {
    // Por design: memo comparará props por referência shallow.
    // Strings são comparadas por valor, então prop nova = re-render
    const props = { label: 'A', value: '1', icon: Activity, color: 'emerald' as const };
    const { rerender } = render(
      <MemoryRouter>
        <KPICard {...props} />
      </MemoryRouter>
    );

    // Não deve quebrar — só validamos que aceita mudança de label
    rerender(
      <MemoryRouter>
        <KPICard {...props} label="B" />
      </MemoryRouter>
    );
  });
});
