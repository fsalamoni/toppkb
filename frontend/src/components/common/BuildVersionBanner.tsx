/**
 * BuildVersionBanner — versão fixa + banner de atualização
 *
 * - Span fixo no canto inferior direito: mostra "v[BUILD_ID]" sempre
 * - Banner vermelho grande no topo: aparece QUANDO o localStorage tem versão
 *   diferente da CURRENT_BUILD (significa que o usuário está com cache antigo)
 * - O banner TEM botão X pra fechar (e não reaparecer)
 */
import { useEffect, useState } from 'react';

// ID do build é injetado em tempo de build via VITE_BUILD_ID
const CURRENT_BUILD: string = (() => {
  try {
    // @ts-expect-error - Vite injeta em build
    const id = import.meta.env.VITE_BUILD_ID;
    if (id && typeof id === 'string' && id.length > 0) return id;
    return 'dev-unknown';
  } catch {
    return 'unknown';
  }
})();

const BUILD_KEY = 'toppkb_build_id';
const DISMISSED_KEY = 'toppkb_update_dismissed';

export function BuildVersionBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BUILD_KEY);
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      const isOld = stored && stored !== CURRENT_BUILD;
      // Só mostra se for antigo E não foi dismissado nesta versão
      setShowBanner(Boolean(isOld && dismissed !== CURRENT_BUILD));
      // Atualizar build ID
      localStorage.setItem(BUILD_KEY, CURRENT_BUILD);
    } catch {
      // localStorage indisponível (modo privado)
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, CURRENT_BUILD);
    } catch {
      // noop
    }
    setShowBanner(false);
  };

  return (
    <>
      {/* Banner vermelho grande no topo - só aparece se versão antiga */}
      {showBanner && (
        <div
          role="alert"
          data-testid="update-banner"
          className="bg-red-600 text-white px-4 py-3 flex items-center justify-between text-sm font-medium sticky top-0 z-50"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span className="truncate">
              <strong>Versão antiga detectada.</strong> Clique em "Atualizar agora".
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
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
                window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
              }}
              className="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-red-50 text-xs md:text-sm"
            >
              Atualizar agora
            </button>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-red-200 px-2 text-lg"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Span fixo no canto - mostra versão sempre (debug/info) */}
      <span
        data-testid="build-version-tag"
        className="fixed bottom-1 right-1 z-40 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/70 px-1.5 py-0.5 rounded bg-muted/30 transition-colors cursor-help"
        title={`Build ${CURRENT_BUILD}`}
      >
        v{CURRENT_BUILD.slice(0, 12)}
      </span>
    </>
  );
}

export { CURRENT_BUILD };
