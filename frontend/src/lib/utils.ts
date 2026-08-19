import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatKg(kg: number, digits = 1): string {
  return `${kg.toFixed(digits)} kg`;
}

export function calcularIMC(peso: number, alturaCm: number): number {
  if (!alturaCm || alturaCm <= 0) return 0;
  const alturaM = alturaCm / 100;
  return peso / (alturaM * alturaM);
}

export function classificarIMC(imc: number): { label: string; cor: string } {
  if (imc < 18.5) return { label: 'Abaixo do peso', cor: 'text-blue-500' };
  if (imc < 25) return { label: 'Normal', cor: 'text-green-500' };
  if (imc < 30) return { label: 'Sobrepeso', cor: 'text-yellow-500' };
  if (imc < 35) return { label: 'Obesidade I', cor: 'text-orange-500' };
  if (imc < 40) return { label: 'Obesidade II', cor: 'text-red-500' };
  return { label: 'Obesidade III', cor: 'text-red-700' };
}

export function tempoRelativo(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD < 7) return `há ${diffD}d`;
  return formatDate(d);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formata duração em minutos para texto legível.
 * 65 → "1h 5min"
 * 30 → "30min"
 * 120 → "2h"
 */
export function formatDuration(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Formata data-hora relativo a partir de qualquer tipo.
 */
export function formatDateTimeAny(ts: any): string {
  if (!ts) return '';
  if (ts instanceof Timestamp) return formatDateTime(ts.toDate().toISOString());
  if (typeof ts === 'string') return formatDateTime(ts);
  if (ts.toDate) return formatDateTime(ts.toDate().toISOString());
  return formatDateTime(ts);
}

/** Diferença em dias inteiros (a - b). */
export function differenceInDays(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Data N dias atrás. */
export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/** Formata data como 'YYYY-MM-DD'. */
export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte qualquer tipo de timestamp do Firestore em Date. */
export function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}
