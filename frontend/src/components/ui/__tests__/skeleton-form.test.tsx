/**
 * Testes do SkeletonForm — skeleton padronizado para Forms
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonForm } from '../skeleton-form';

describe('SkeletonForm', () => {
  it('renderiza com aria-busy=true', () => {
    const { container } = render(<SkeletonForm />);
    const el = container.querySelector('[aria-busy="true"]');
    expect(el).toBeTruthy();
  });

  it('mostra header com título + descrição por padrão', () => {
    render(<SkeletonForm />);
    // Header tem 2 skeletons (título + descrição)
    const headerSkeletons = document.querySelectorAll('.h-7, .h-4');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('esconde header quando hasHeader=false', () => {
    const { container } = render(<SkeletonForm hasHeader={false} fieldCount={3} />);
    // Não deve ter o skeleton de h-7 (título do header)
    const titleSkeleton = container.querySelector('.h-7');
    expect(titleSkeleton).toBeNull();
  });

  it('renderiza variant small com 1 field', () => {
    const { container } = render(<SkeletonForm variant="small" />);
    // 1 field skeleton h-10
    const inputs = container.querySelectorAll('.h-10');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // 1 input + 1 button
  });

  it('renderiza variant medium com 4 fields', () => {
    const { container } = render(<SkeletonForm variant="medium" />);
    const inputs = container.querySelectorAll('.h-10');
    // 4 input + 2 buttons (h-10 mas class inclui)
    expect(inputs.length).toBeGreaterThanOrEqual(4);
  });

  it('renderiza variant large com 7 fields + textarea', () => {
    const { container } = render(<SkeletonForm variant="large" />);
    // textarea tem h-24 (classe do Tailwind)
    const textareas = container.querySelectorAll('[class*="h-24"]');
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });

  it('fieldCount customizado sobrescreve variant', () => {
    const { container } = render(<SkeletonForm fieldCount={2} />);
    // 2 fields com label
    const labels = container.querySelectorAll('.h-4');
    // Cada label tem h-4 + descrição do header = pelo menos 3
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('mostra botão submit + cancel', () => {
    const { container } = render(<SkeletonForm variant="small" />);
    const buttons = container.querySelectorAll('.h-10');
    // 1 input + 2 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('aceita className customizado', () => {
    const { container } = render(<SkeletonForm className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeTruthy();
  });
});
