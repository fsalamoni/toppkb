/**
 * LazyImage — wrapper para <img> com lazy loading nativo + placeholders
 *
 * Benefícios vs <img> normal:
 * - loading="lazy" nativo (navegador decide quando carregar)
 * - decoding="async" (não bloqueia main thread)
 * - srcSet opcional para responsive images
 * - Placeholder enquanto carrega
 *
 * USO:
 *   <LazyImage src="/foto.jpg" alt="Foto de treino" width={400} height={300} />
 */
import { useState, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  srcSet?: string;
  /** Classes opcionais do container (caso queira skeleton) */
  containerClassName?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  srcSet,
  className,
  containerClassName,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <span
      className={containerClassName}
      style={{
        display: 'inline-block',
        backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
      }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? '(max-width: 768px) 100vw, 768px' : undefined}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={className}
        style={{
          opacity: loaded ? 1 : 0.6,
          transition: 'opacity 200ms',
          ...(width && height ? { aspectRatio: `${width}/${height}` } : {}),
        }}
        {...props}
      />
    </span>
  );
}
