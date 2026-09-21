/**
 * Testes do useKeyboardShortcuts — atalhos de teclado
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

const fireKey = (key: string, options: Partial<KeyboardEvent> = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  window.dispatchEvent(event);
};

const fireKeyOnTarget = (target: HTMLElement, key: string, options: Partial<KeyboardEvent> = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);
};

describe('useKeyboardShortcuts', () => {
  it('Cmd+S aciona onSave', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    fireKey('s', { metaKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+S também aciona onSave', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    fireKey('s', { ctrlKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('Cmd+K aciona onSearch', () => {
    const onSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearch }));

    fireKey('k', { metaKey: true });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('Escape aciona onEscape', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onEscape }));

    fireKey('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('? aciona onHelp', () => {
    const onHelp = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onHelp }));

    fireKey('?');

    expect(onHelp).toHaveBeenCalledTimes(1);
  });

  it('não aciona onHelp quando typing em input', () => {
    const onHelp = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onHelp }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireKeyOnTarget(input, '?');

    expect(onHelp).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('g + d aciona onGoDashboard', () => {
    const onGoDashboard = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onGoDashboard }));

    fireKey('g');
    fireKey('d');

    expect(onGoDashboard).toHaveBeenCalledTimes(1);
  });

  it('g + t aciona onGoTreinos', () => {
    const onGoTreinos = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onGoTreinos }));

    fireKey('g');
    fireKey('t');

    expect(onGoTreinos).toHaveBeenCalledTimes(1);
  });

  it('g + p aciona onGoPartidas', () => {
    const onGoPartidas = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onGoPartidas }));

    fireKey('g');
    fireKey('p');

    expect(onGoPartidas).toHaveBeenCalledTimes(1);
  });

  it('g sozinho não aciona nada', () => {
    const onGoDashboard = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onGoDashboard }));

    fireKey('g');
    // Não tem segundo g

    expect(onGoDashboard).not.toHaveBeenCalled();
  });

  it('Esc funciona mesmo em input', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onEscape }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireKeyOnTarget(input, 'Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });
});
