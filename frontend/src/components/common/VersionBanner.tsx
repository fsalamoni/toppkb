/**
 * Banner de versão - aparece no topo de todas as páginas
 * Permite ao usuário confirmar se está vendo a versão mais recente
 */
import { useEffect, useState } from 'react';

const BUILD_ID = 'BUILD-' + (import.meta.env.VITE_BUILD_ID || Date.now().toString(36).toUpperCase());

export function VersionBanner() {
  const [show, setShow] = useState(false);
  const [buildId, setBuildId] = useState<string>('');

  useEffect(() => {
    // Detecta se está rodando versão antiga
    const expected = import.meta.env.VITE_BUILD_ID;
    const stored = localStorage.getItem('toppkb_build_id');
    
    if (stored && stored !== expected) {
      setShow(true);
    }
    localStorage.setItem('toppkb_build_id', expected || '');
    setBuildId(expected || 'unknown');
  }, []);

  if (!show) return null;

  return (
    <div 
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#dc2626',
        color: 'white',
        padding: '12px',
        zIndex: 99999,
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      ⚠️ Nova versão disponível! Você está vendo versão antiga.
      <button
        onClick={() => window.location.reload()}
        style={{
          marginLeft: '12px',
          background: 'white',
          color: '#dc2626',
          padding: '4px 12px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        Atualizar agora
      </button>
      <button
        onClick={() => setShow(false)}
        style={{
          marginLeft: '8px',
          background: 'transparent',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
