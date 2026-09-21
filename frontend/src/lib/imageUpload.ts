/**
 * imageUpload.ts — helper para upload de imagens com preview
 *
 - Validação client-side (tipo + tamanho)
 - Preview como DataURL antes do upload
 - Compressão opcional via canvas
 - Suporte a Firebase Storage
 *
 * USO:
 *   const { file, dataURL, pickFile, clear } = useImageUpload({ maxSizeMB: 2 });
 *
 *   <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
 *   {dataURL && <img src={dataURL} />}
 */
import { useState, useRef, useCallback } from 'react';

export interface ImageUploadOptions {
  /** Tamanho máximo em MB */
  maxSizeMB?: number;
  /** Tipos aceitos (default: image/*) */
  acceptedTypes?: string[];
  /** Comprimir para no máximo X pixels de largura */
  maxWidthPx?: number;
  /** Qualidade JPEG (0-1) */
  quality?: number;
}

export interface ImageUploadState {
  file: File | null;
  dataURL: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function useImageUpload(options: ImageUploadOptions = {}) {
  const {
    maxSizeMB = 5,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxWidthPx = 1024,
    quality = 0.85,
  } = options;

  const [state, setState] = useState<ImageUploadState>({
    file: null,
    dataURL: null,
    uploading: false,
    progress: 0,
    error: null,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const clear = useCallback(() => {
    setState({ file: null, dataURL: null, uploading: false, progress: 0, error: null });
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const pickFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement> | File) => {
      const file = event instanceof File ? event : event.target.files?.[0];
      if (!file) return;

      setState({ file: null, dataURL: null, uploading: false, progress: 0, error: null });

      // Validação tipo
      if (!acceptedTypes.includes(file.type)) {
        setState((s) => ({ ...s, error: `Tipo não suportado: ${file.type}` }));
        return;
      }

      // Validação tamanho
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setState((s) => ({
          ...s,
          error: `Arquivo muito grande: ${sizeMB.toFixed(1)}MB (max ${maxSizeMB}MB)`,
        }));
        return;
      }

      try {
        // Ler como DataURL (preview)
        const dataURL = await readAsDataURL(file);

        // Comprimir se necessário
        const finalDataURL = await compressImage(dataURL, maxWidthPx, quality);

        setState({
          file,
          dataURL: finalDataURL,
          uploading: false,
          progress: 0,
          error: null,
        });
      } catch (e: any) {
        setState((s) => ({ ...s, error: e.message || 'Erro ao processar' }));
      }
    },
    [acceptedTypes, maxSizeMB, maxWidthPx, quality],
  );

  return { ...state, inputRef, pickFile, clear, handleFile };
}

function readAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function compressImage(dataURL: string, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Se já é pequeno, retorna como está
      if (img.width <= maxWidth) {
        resolve(dataURL);
        return;
      }

      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataURL); // fallback
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
}
