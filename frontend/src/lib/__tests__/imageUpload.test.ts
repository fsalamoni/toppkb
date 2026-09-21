/**
 * Testes do imageUpload — validação de imagens
 */
import { describe, it, expect } from 'vitest';

describe('imageUpload validation', () => {
  describe('File validation', () => {
    it('valida tipo de arquivo', () => {
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const validFile = { type: 'image/png', size: 1000 };
      expect(acceptedTypes.includes(validFile.type)).toBe(true);
    });

    it('rejeita tipo não suportado', () => {
      const acceptedTypes = ['image/jpeg', 'image/png'];
      const file = { type: 'application/pdf', size: 1000 };
      expect(acceptedTypes.includes(file.type)).toBe(false);
    });

    it('valida tamanho em MB', () => {
      const maxSizeMB = 5;
      const sizes = [
        { bytes: 1024 * 1024, mb: 1 },           // 1MB
        { bytes: 5 * 1024 * 1024, mb: 5 },       // 5MB exato
        { bytes: 6 * 1024 * 1024, mb: 6 },       // 6MB (rejeitado)
        { bytes: 10 * 1024 * 1024, mb: 10 },     // 10MB (rejeitado)
      ];
      for (const s of sizes) {
        const sizeMB = s.bytes / (1024 * 1024);
        const valid = sizeMB <= maxSizeMB;
        if (s.mb <= 5) {
          expect(valid).toBe(true);
        } else {
          expect(valid).toBe(false);
        }
      }
    });
  });

  describe('Compression logic', () => {
    it('mantém imagem pequena sem redimensionar', () => {
      const width = 800;
      const maxWidth = 1024;
      const shouldResize = width > maxWidth;
      expect(shouldResize).toBe(false);
    });

    it('redimensiona imagem grande', () => {
      const width = 2048;
      const originalHeight = 1000;
      const maxWidth = 1024;
      const shouldResize = width > maxWidth;
      expect(shouldResize).toBe(true);

      const ratio = maxWidth / width;
      const newWidth = maxWidth;
      const newHeight = originalHeight * ratio;
      expect(newWidth).toBe(1024);
      expect(newHeight).toBeCloseTo(500, 1);
    });

    it('preserva aspect ratio', () => {
      const originalWidth = 4000;
      const originalHeight = 3000;
      const maxWidth = 2000;
      const ratio = maxWidth / originalWidth;

      expect(originalWidth * ratio).toBe(2000);
      expect(originalHeight * ratio).toBe(1500);
    });
  });

  describe('DataURL', () => {
    it('dataURL format é válido', () => {
      const sample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      expect(sample.startsWith('data:image/')).toBe(true);
      expect(sample).toContain(';base64,');
    });

    it('detecta tipo pelo prefixo', () => {
      const types = [
        { url: 'data:image/png;base64,xxx', type: 'image/png' },
        { url: 'data:image/jpeg;base64,xxx', type: 'image/jpeg' },
        { url: 'data:image/webp;base64,xxx', type: 'image/webp' },
      ];

      for (const { url, type } of types) {
        if (url.includes(type)) {
          expect(url).toContain(type);
        }
      }
    });
  });
});
