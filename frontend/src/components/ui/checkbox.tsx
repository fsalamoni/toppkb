// Stub temporário — Radix UI checkbox não instalado. Usar input checkbox nativo.
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn('h-4 w-4 rounded border-gray-300', className)}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';
