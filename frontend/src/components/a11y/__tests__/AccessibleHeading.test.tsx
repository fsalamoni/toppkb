/**
 * Testes de componentes A11y — SkipLink, VisuallyHidden, Heading, LiveRegion, Focusable
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink, VisuallyHidden, Heading, LiveRegion, Focusable } from '../AccessibleHeading';

describe('A11y - SkipLink', () => {
  it('renderiza como link para o destino', () => {
    render(<div><SkipLink targetId="main" /></div>);

    const link = screen.getByRole('link', { name: /Pular para o conteúdo/i });
    expect(link).toHaveAttribute('href', '#main');
  });

  it('aceita texto customizado', () => {
    render(<div><SkipLink targetId="content">Saltar</SkipLink></div>);

    expect(screen.getByRole('link', { name: 'Saltar' })).toBeInTheDocument();
  });

  it('aplica sr-only por padrão (esconde visualmente)', () => {
    render(<div><SkipLink targetId="x" /></div>);

    const link = screen.getByRole('link');
    expect(link.className).toContain('sr-only');
  });
});

describe('A11y - VisuallyHidden', () => {
  it('renderiza como span com sr-only', () => {
    render(<VisuallyHidden>Conteúdo oculto</VisuallyHidden>);

    const span = screen.getByText('Conteúdo oculto');
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toContain('sr-only');
  });

  it('aceita outros elementos', () => {
    render(<VisuallyHidden as="div"><p>Texto</p></VisuallyHidden>);

    const div = screen.getByText('Texto').parentElement;
    expect(div?.tagName).toBe('DIV');
    expect(div?.className).toContain('sr-only');
  });

  it('conteúdo é acessível para screen readers', () => {
    render(<VisuallyHidden>Informação adicional</VisuallyHidden>);

    // Texto está no DOM
    expect(screen.getByText('Informação adicional')).toBeInTheDocument();
  });
});

describe('A11y - Heading', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renderiza h%i com tamanho apropriado', (level) => {
    render(<Heading level={level}>Título {level}</Heading>);

    const heading = screen.getByRole('heading', { level });
    expect(heading.tagName).toBe(`H${level}`);
    expect(heading).toHaveTextContent(`Título ${level}`);
  });

  it('aplica id quando passado', () => {
    render(<Heading level={2} id="section-1">Título</Heading>);

    const heading = screen.getByRole('heading');
    expect(heading).toHaveAttribute('id', 'section-1');
  });

  it('default é h2 (não h1) para evitar múltiplos h1', () => {
    render(<><Heading>Título</Heading></>);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('combina classes customizadas', () => {
    render(<Heading level={2} className="text-amber-500">Título</Heading>);

    const heading = screen.getByRole('heading');
    expect(heading.className).toContain('text-amber-500');
    expect(heading.className).toContain('font-bold');
  });
});

describe('A11y - LiveRegion', () => {
  it('renderiza com role="status" e aria-live', () => {
    render(<LiveRegion message="Salvo com sucesso" />);

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Salvo com sucesso');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('suporta politeness assertive', () => {
    render(<LiveRegion message="Erro!" politeness="assertive" />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('sr-only esconde visualmente', () => {
    render(<LiveRegion message="hidden" />);

    const region = screen.getByRole('status');
    expect(region.className).toContain('sr-only');
  });
});

describe('A11y - Focusable', () => {
  it('renderiza div com role quando onClick', () => {
    render(
      <Focusable onClick={() => {}} ariaLabel="Card clicável">
        Conteúdo
      </Focusable>
    );

    const el = screen.getByRole('button', { name: 'Card clicável' });
    expect(el).toHaveAttribute('tabIndex', '0');
  });

  it('sem onClick não é focável', () => {
    render(<Focusable>Conteúdo</Focusable>);

    // Sem onClick → sem role button → div estática
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('aplica classes de focus visível', () => {
    render(<Focusable onClick={() => {}}>Conteúdo</Focusable>);

    const el = screen.getByRole('button');
    expect(el.className).toContain('focus-visible:ring');
  });

  it('renderiza children corretamente', () => {
    render(
      <Focusable>
        <span>Inner</span>
      </Focusable>
    );

    expect(screen.getByText('Inner')).toBeInTheDocument();
  });
});
