/**
 * Helpers matemáticos.
 */

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function round(n: number, digits = 2): number {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

export function calcularIMC(peso: number, alturaCm: number): number {
  if (!peso || !alturaCm) return 0;
  const alturaM = alturaCm / 100;
  return peso / (alturaM * alturaM);
}

export function classificarIMC(imc: number): { label: string; cor: string } {
  if (imc < 18.5) return { label: 'Abaixo do peso', cor: 'azul' };
  if (imc < 25) return { label: 'Normal', cor: 'verde' };
  if (imc < 30) return { label: 'Sobrepeso', cor: 'amarelo' };
  if (imc < 35) return { label: 'Obesidade I', cor: 'laranja' };
  if (imc < 40) return { label: 'Obesidade II', cor: 'vermelho' };
  return { label: 'Obesidade III', cor: 'vermelho-escuro' };
}
