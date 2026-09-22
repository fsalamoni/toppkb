/**
 * BuildVersionBanner — mostra versão do build no topo da página
 *
 * CRÍTICO para resolver o problema do owner que continua vendo versão antiga:
 * - Mostra timestamp do build atual em texto visível
 * - Se detectar cache antigo via localStorage, mostra banner pedindo reload
 * - Atualiza localStorage em cada load
 *
 * Para o owner: se você vir o banner vermelho "Versão antiga detectada",
 * clique em "Atualizar agora" — isso força reload bypassing SW.
 */
import { useEffect, useState } from 'react';

// ID do build é injetado em tempo de build via Vite (ver vite.config)
// Fallback: hash determinístico baseado no tempo de import
const CURRENT_BUILD = (() => {
  try {
    // @ts-expect-error - Vite injeta isso em build
    return import.meta.env.VITE_BUILD_ID || `dev-${Date.now().toString(36)}`;
  } catch {
    return 'unknown';
  }
})();

const BUILD_KEY = 'toppkb_build_id';

export function BuildVersionBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(BUILD_KEY);
    if (stored && stored !== CURRENT_BUILD) {
      // Versão diferente detectada - mostrar banner pedindo reload
      setShowBanner(true);
    }
    // Atualizar build ID atual
    try {
      localStorage.setItem(BUILD_KEY, CURRENT_BUILD);
    } catch {
      // localStorage pode estar bloqueado em modo privado
    }
  }, []);

  if (showBanner) {
    return (
      <div
        role="alert"
        data-testid="update-banner"
        className="bg-red-600 text-white px-4 py-3 flex items-center justify-between text-sm font-medium sticky top-0 z-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>
            <strong>Versão antiga detectada.</strong> Você precisa atualizar pra ver o novo conteúdo.
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Limpar todos os caches do SW antes de recarregar
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((regs) => {
                  regs.forEach((reg) => reg.unregister());
                });
              }
              if ('caches' in window) {
                caches.keys().then((names) => {
                  names.forEach((name) => caches.delete(name));
                });
              }
              // Recarregar com cache-bust
              window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
            }}
            className="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-red-50"
          >
            Atualizar agora
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white hover:text-red-200 px-2"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Banner debug sempre visível (rodapé pequeno)
  return (
    <span
      className="fixed bottom-1 right-1 z-40 text-[10px] font-mono text-muted-foreground/40 px-1.5 py-0.5 rounded bg-muted/50 pointer-events-none"
      title="Build version"
    >
      v{CURRENT_BUILD.slice(0, 12)}
    </span>
  );
}

export { CURRENT_BUILD };
