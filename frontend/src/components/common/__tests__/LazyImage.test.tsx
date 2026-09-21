/**
 * Testes do LazyImage — wrapper para imagens com lazy loading
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

describe('LazyImage', () => {
  it('renderiza com loading lazy nativo', () => {
    render(<LazyImage src="/img.jpg" alt="descrição" />);
    const img = screen.getByAltText('descrição');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('aceita srcSet', () => {
    render(
      <LazyImage
        src="/img-400.jpg"
        srcSet="/img-400.jpg 400w, /img-800.jpg 800w"
        alt="test"
      />
    );
    const img = screen.getByAltText('test');
    expect(img.getAttribute('srcset')).toContain('img-400.jpg 400w');
  });

  it('marca como carregado em onLoad', () => {
    render(<LazyImage src="/img.jpg" alt="test" />);
    const img = screen.getByAltText('test');

    // Inicialmente opacity 0.6
    expect(img.style.opacity).toBe('0.6');

    fireEvent.load(img);
    expect(img.style.opacity).toBe('1');
  });

  it('marca como erro em onError', () => {
    render(<LazyImage src="/bad.jpg" alt="test" />);
    const img = screen.getByAltText('test');

    fireEvent.error(img);
    // O span wrapper deve ter backgroundColor vermelho
    const span = img.parentElement;
    expect(span?.style.backgroundColor).toContain('rgba(239, 68, 68, 0.1)');
  });

  it('passa width e height', () => {
    render(<LazyImage src="/img.jpg" alt="test" width={400} height={300} />);
    const img = screen.getByAltText('test');
    expect(img.getAttribute('width')).toBe('400');
    expect(img.getAttribute('height')).toBe('300');
  });
});
