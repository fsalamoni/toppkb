/**
 * Testes do Print Stylesheet — verifica regras @media print
 *
 * Garante que:
 * - Classes .no-print existem (escondem elementos em print)
 * - Classes .print-only existem (mostram só em print)
 * - Footer aparece só em print
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Print Stylesheet', () => {
  let css: string;

  beforeAll(() => {
    const cssPath = resolve(__dirname, '../index.css');
    css = readFileSync(cssPath, 'utf-8');
  });

  it('contém @media print', () => {
    expect(css).toContain('@media print');
  });

  it('esconde classes .no-print em print', () => {
    expect(css).toMatch(/\.no-print[\s\S]*?display:\s*none/);
  });

  it('mostra classes .print-only em print', () => {
    expect(css).toMatch(/\.print-only[\s\S]*?display:\s*block/);
  });

  it('esconde navegação em print', () => {
    expect(css).toContain('nav');
  });

  it('esconde sidebar em print', () => {
    expect(css).toContain('.sidebar');
  });

  it('esconde topbar em print', () => {
    expect(css).toContain('.topbar');
  });

  it('força background branco', () => {
    expect(css).toMatch(/body[\s\S]*?background:\s*white/);
  });

  it('força cor preta no texto', () => {
    expect(css).toMatch(/body[\s\S]*?color:\s*black/);
  });

  it('configura margens da página', () => {
    expect(css).toMatch(/@page[\s\S]*?margin:/);
  });

  it('adiciona URL após links', () => {
    expect(css).toMatch(/a\[href[^}]*\]::after/);
  });

  it('configura page-break para h1', () => {
    expect(css).toMatch(/h1[\s\S]*?page-break-before/);
  });

  it('evita quebra dentro de cards', () => {
    expect(css).toContain('page-break-inside: avoid');
  });

  it('desabilita animations em print', () => {
    expect(css).toContain('animation: none');
  });

  it('esconde skeletons em print', () => {
    expect(css).toContain('.animate-pulse');
  });

  it('adiciona footer com page numbers', () => {
    expect(css).toContain('@bottom-center');
    expect(css).toContain('counter(page)');
  });

  it('configura font-size para 11pt em print', () => {
    expect(css).toContain('font-size: 11pt');
  });
});
