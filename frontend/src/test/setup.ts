import '@testing-library/jest-dom';

// jsdom não implementa matchMedia — vários componentes (usePWA, media queries) usam.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

// jsdom não implementa ResizeObserver (usado por react-window + nosso VirtualList).
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  (window as any).ResizeObserver = MockResizeObserver;
}
if (typeof globalThis !== 'undefined' && !(globalThis as any).ResizeObserver) {
  (globalThis as any).ResizeObserver = MockResizeObserver;
}
