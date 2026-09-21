/**
 * 🎉 Confetti — Animação de confetti simples e leve
 *
 * Sem dependências externas — usa CSS animations nativas.
 * Aparece e some sozinho após 2.5s.
 */

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
  count?: number;
}

const CORES = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#fbbf24'];

export function Confetti({ trigger, count = 30 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; cor: string; rot: number }>>([]);

  useEffect(() => {
    if (!trigger) {
      setPieces([]);
      return;
    }
    const novos = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 1.5,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
      rot: Math.random() * 360,
    }));
    setPieces(novos);
    const timeout = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(timeout);
  }, [trigger, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 w-2 h-3"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.cor,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
