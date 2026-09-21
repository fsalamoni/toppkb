/**
 * validators.ts — validações reutilizáveis para Forms
 *
 * Cada validator retorna:
 * - null se válido
 * - string com mensagem de erro se inválido
 *
 * USO:
 *   const error = validateRequired(value, 'Nome');
 *   if (error) toast.error(error);
 *
 *   // Composição
 *   const validateForm = composeValidators(
 *     validateRequired('titulo'),
 *     validateMinLength(3, 'titulo'),
 *   );
 *   const error = validateForm(formData);
 */

export type Validator<T = any> = (value: any, formData?: T) => string | null;

export type FieldValidator = Validator & {
  required?: boolean;
  field?: string;
};

/**
 * Campo obrigatório
 */
export function validateRequired(value: any, fieldName: string = 'Este campo'): string | null {
  if (value === null || value === undefined) return `${fieldName} é obrigatório`;
  if (typeof value === 'string' && value.trim() === '') return `${fieldName} é obrigatório`;
  if (Array.isArray(value) && value.length === 0) return `${fieldName} é obrigatório`;
  return null;
}

/**
 * Tamanho mínimo (string)
 */
export function validateMinLength(min: number, fieldName: string = 'Este campo'): Validator {
  return (value) => {
    if (value === null || value === undefined) return null; // covered by required
    if (typeof value !== 'string') return null;
    if (value.length < min) {
      return `${fieldName} deve ter pelo menos ${min} caracteres`;
    }
    return null;
  };
}

/**
 * Tamanho máximo (string)
 */
export function validateMaxLength(max: number, fieldName: string = 'Este campo'): Validator {
  return (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    if (value.length > max) {
      return `${fieldName} deve ter no máximo ${max} caracteres`;
    }
    return null;
  };
}

/**
 * Número em range
 */
export function validateRange(min: number, max: number, fieldName: string = 'Este campo'): Validator {
  return (value) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (isNaN(n)) return `${fieldName} deve ser um número`;
    if (n < min || n > max) {
      return `${fieldName} deve estar entre ${min} e ${max}`;
    }
    return null;
  };
}

/**
 * Email
 */
export function validateEmail(value: any): string | null {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : 'Email inválido';
}

/**
 * URL
 */
export function validateUrl(value: any): string | null {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  try {
    new URL(value);
    return null;
  } catch {
    return 'URL inválida';
  }
}

/**
 * Date válida
 */
export function validateDate(value: any, fieldName: string = 'Data'): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return `${fieldName} inválida`;
  return null;
}

/**
 * Data não no futuro
 */
export function validateNotFuture(value: any, fieldName: string = 'Data'): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return `${fieldName} inválida`;
  if (date.getTime() > Date.now()) {
    return `${fieldName} não pode estar no futuro`;
  }
  return null;
}

/**
 * Peso (kg) - range saudável
 */
export function validateWeight(value: any): string | null {
  if (!value) return null;
  const n = Number(value);
  if (isNaN(n)) return 'Peso deve ser um número';
  if (n < 30 || n > 200) return 'Peso deve estar entre 30kg e 200kg';
  return null;
}

/**
 * Frequência cardíaca (bpm)
 */
export function validateHeartRate(value: any): string | null {
  if (!value) return null;
  const n = Number(value);
  if (isNaN(n)) return 'Frequência deve ser um número';
  if (n < 30 || n > 220) return 'Frequência deve estar entre 30 e 220 bpm';
  return null;
}

/**
 * Duração em minutos (1 min - 8h)
 */
export function validateDuration(value: any): string | null {
  if (!value) return null;
  const n = Number(value);
  if (isNaN(n)) return 'Duração deve ser um número';
  if (n < 1 || n > 480) return 'Duração deve estar entre 1 min e 8h';
  return null;
}

/**
 * Compor múltiplos validators (executa em ordem, retorna primeiro erro)
 */
export function composeValidators<T>(...validators: Array<(value: any, data?: T) => string | null>) {
  return (value: any, data?: T): string | null => {
    for (const v of validators) {
      const err = v(value, data);
      if (err) return err;
    }
    return null;
  };
}

/**
 * Validar objeto inteiro (key = campo, value = validator)
 *
 * USO:
 *   const errors = validateObject(formData, {
 *     titulo: validateRequired,
 *     duracao: validateDuration,
 *   });
 *   if (errors.duracao) ...
 */
export function validateObject(
  data: Record<string, any>,
  schema: Record<string, Validator>,
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};
  for (const [key, validator] of Object.entries(schema)) {
    const err = validator(data[key], data);
    if (err) errors[key] = err;
  }
  return errors;
}

/**
 * Retorna true se objeto de erros está vazio (sem erros)
 */
export function isValid(errors: Record<string, string | null>): boolean {
  return Object.values(errors).every((e) => e === null || e === undefined);
}
