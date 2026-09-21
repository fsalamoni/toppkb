/**
 * useFormValidation — hook para validação de Forms com schema
 *
 * USO:
 *   const { errors, validate, validateField, isValid } = useFormValidation({
 *     titulo: validateRequired,
 *     duracao: validateDuration,
 *     peso: validateWeight,
 *   });
 *
 *   const handleSubmit = () => {
 *     const errs = validate(formData);
 *     if (Object.values(errs).some(e => e)) {
 *       toast.error('Corrija os erros antes de salvar');
 *       return;
 *     }
 *     save(formData);
 *   };
 */
import { useState, useCallback } from 'react';
import { validateObject, isValid as allValid, type Validator } from '@/lib/validators';

export interface UseFormValidationReturn<T> {
  /** Mapa de erros por campo */
  errors: Record<string, string | null>;
  /** Valida o form inteiro */
  validate: (data: T) => Record<string, string | null>;
  /** Valida um campo específico */
  validateField: (field: string, value: any, data?: T) => string | null;
  /** Limpa todos os erros */
  clear: () => void;
  /** Se não há erros */
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: Record<keyof T, Validator<T>>,
  initialData?: T,
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = useCallback(
    (data: T) => {
      // Cast genérico para validateObject (que aceita Record<string, any>)
      const errs = validateObject(data as any, schema as any);
      setErrors(errs);
      return errs;
    },
    [schema],
  );

  const validateField = useCallback(
    (field: string, value: any, data?: T): string | null => {
      const validator = schema[field];
      if (!validator) return null;
      const err = validator(value, data || (initialData as T));
      setErrors((prev) => ({ ...prev, [field]: err }));
      return err;
    },
    [schema, initialData],
  );

  const clear = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    validateField,
    clear,
    isValid: allValid(errors),
  };
}
