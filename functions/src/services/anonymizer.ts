/**
 * Anonymizer — filtra PII básico antes de enviar ao LLM.
 *
 * Remove:
 *  - E-mails
 *  - CPF / RG / CNPJ
 *  - Telefones
 *  - Cartões de crédito
 *
 * IMPORTANTE: este filtro é "best effort" — não substitui revisão humana
 * para uso em produção com dados sensíveis.
 */

const PATTERNS = {
  email: /\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g,
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  phone: /\b\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g,
  rg: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]?\b/g,
  creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
};

const REPLACEMENTS: Record<keyof typeof PATTERNS, string> = {
  email: '[EMAIL]',
  cpf: '[CPF]',
  cnpj: '[CNPJ]',
  phone: '[PHONE]',
  rg: '[RG]',
  creditCard: '[CARD]',
};

export interface AnonymizedText {
  text: string;
  piiRemoved: number;
  piiTypes: string[];
}

export function anonymizeText(text: string): AnonymizedText {
  let result = text;
  let piiRemoved = 0;
  const piiTypes: string[] = [];

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    const matches = result.match(pattern);
    if (matches && matches.length > 0) {
      piiRemoved += matches.length;
      piiTypes.push(type);
      result = result.replace(pattern, REPLACEMENTS[type as keyof typeof PATTERNS]);
    }
  }

  return { text: result, piiRemoved, piiTypes };
}

export function filterPII(text: string): AnonymizedText {
  return anonymizeText(text);
}
