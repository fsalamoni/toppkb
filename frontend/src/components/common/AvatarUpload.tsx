/**
 * AvatarUpload — avatar do usuário com upload
 *
 * Mostra imagem atual + botão para trocar
 * Preview da nova imagem antes de salvar
 * Integra com useImageUpload
 */
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/lib/imageUpload';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  fallbackInitials?: string;
  onSave: (dataURL: string) => Promise<void>;
  onClear?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function AvatarUpload({
  currentUrl,
  fallbackInitials = '?',
  onSave,
  onClear,
  size = 'md',
}: AvatarUploadProps) {
  const { dataURL, inputRef, pickFile, handleFile, clear } = useImageUpload({
    maxSizeMB: 2,
    maxWidthPx: 512,
    quality: 0.9,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = dataURL || currentUrl;

  const handleSave = async () => {
    if (!dataURL) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(dataURL);
      clear();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!onClear) return;
    setSaving(true);
    setError(null);
    try {
      await onClear();
    } catch (e: any) {
      setError(e.message || 'Erro ao remover');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'relative rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center',
          SIZES[size],
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-semibold text-muted-foreground">
            {fallbackInitials.slice(0, 2).toUpperCase()}
          </span>
        )}

        {/* Overlay com botão de câmera */}
        <button
          type="button"
          onClick={pickFile}
          disabled={saving}
          className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group"
          aria-label="Trocar avatar"
        >
          <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Input invisível */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e as any)}
        className="hidden"
        aria-hidden="true"
      />

      {/* Botões de ação */}
      <div className="flex gap-2">
        {dataURL && (
          <>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={clear} disabled={saving}>
              Cancelar
            </Button>
          </>
        )}
        {!dataURL && currentUrl && onClear && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={saving}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remover
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
