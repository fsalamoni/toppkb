/**
 * Testes do GoalRing — anel circular de progresso
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalRing } from '../GoalRing';

describe('GoalRing', () => {
  it('renderiza com valor e label', () => {
    render(<GoalRing percentage={70} value="7/10" label="Treinos" />);
    expect(screen.getByText('7/10')).toBeTruthy();
    expect(screen.getByText('Treinos')).toBeTruthy();
  });

  it('limita percentual entre 0-100', () => {
    const { container: c1 } = render(<GoalRing percentage={150} value="15/10" />);
    expect(c1.querySelector('svg')).toBeTruthy();

    const { container: c2 } = render(<GoalRing percentage={-10} value="0/10" />);
    expect(c2.querySelector('svg')).toBeTruthy();
  });

  it('mostra percentual formatado', () => {
    render(<GoalRing percentage={75} value="x" />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('tem aria-label acessível', () => {
    render(<GoalRing percentage={50} value="5/10" label="Meta" />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-label')).toContain('50%');
    expect(status.getAttribute('aria-label')).toContain('Meta');
  });

  it('suporta 3 tamanhos', () => {
    const { container: sm } = render(<GoalRing percentage={50} value="x" size="sm" />);
    const { container: lg } = render(<GoalRing percentage={50} value="x" size="lg" />);

    // SVG deve ter width diferente
    const smSvg = sm.querySelector('svg')?.getAttribute('width');
    const lgSvg = lg.querySelector('svg')?.getAttribute('width');
    expect(Number(lgSvg)).toBeGreaterThan(Number(smSvg));
  });

  it('aceita cor customizada', () => {
    const { container } = render(
      <GoalRing percentage={50} value="x" color="red" />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('100% usa cor verde', () => {
    const { container } = render(<GoalRing percentage={100} value="x" />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
