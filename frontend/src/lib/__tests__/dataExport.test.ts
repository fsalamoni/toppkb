/**
 * Testes do dataExport — funções de CSV e estrutura de dados
 */
import { describe, it, expect } from 'vitest';
import { convertToCSV } from '../dataExport';

describe('convertToCSV', () => {
  it('retorna string vazia para array vazio', () => {
    expect(convertToCSV([])).toBe('');
  });

  it('converte array simples', () => {
    const data = [
      { nome: 'João', idade: 44 },
      { nome: 'Maria', idade: 50 },
    ];
    const csv = convertToCSV(data);
    expect(csv).toContain('nome,idade');
    expect(csv).toContain('João,44');
    expect(csv).toContain('Maria,50');
  });

  it('escapa vírgulas em valores', () => {
    const data = [{ descricao: 'Treino de manhã, às 7h' }];
    const csv = convertToCSV(data);
    expect(csv).toContain('"Treino de manhã, às 7h"');
  });

  it('escapa aspas duplas em valores', () => {
    const data = [{ descricao: 'Atleta "TOP"' }];
    const csv = convertToCSV(data);
    expect(csv).toContain('"Atleta ""TOP"""');
  });

  it('escapa quebras de linha em valores', () => {
    const data = [{ nota: 'Linha 1\nLinha 2' }];
    const csv = convertToCSV(data);
    expect(csv).toContain('"Linha 1\nLinha 2"');
  });

  it('coleta todas as chaves únicas', () => {
    const data = [
      { a: 1, b: 2 },
      { a: 3, c: 4 },
      { b: 5, c: 6 },
    ];
    const lines = convertToCSV(data).split('\n');
    expect(lines[0]).toContain('a');
    expect(lines[0]).toContain('b');
    expect(lines[0]).toContain('c');
    expect(lines[0].split(',')).toHaveLength(3);
  });

  it('serializa objetos como JSON', () => {
    const data = [
      { id: 1, meta: { tipo: 'quadra', duracao: 90 } },
    ];
    const csv = convertToCSV(data);
    // JSON.stringify produz {"tipo":"quadra","duracao":90} sem escape
    // porque não tem vírgulas dentro
    expect(csv).toContain('{"tipo":"quadra","duracao":90}');
  });

  it('preserva null e undefined como vazio', () => {
    const data = [{ nome: 'João', apelido: null, nota: undefined }];
    const csv = convertToCSV(data);
    // null e undefined viram campo vazio
    expect(csv).toContain('João,,');
  });

  it('preserva ordem das chaves do primeiro item', () => {
    const data = [
      { a: 1, b: 2, c: 3 },
    ];
    const csv = convertToCSV(data);
    const header = csv.split('\n')[0];
    expect(header.indexOf('a')).toBeLessThan(header.indexOf('b'));
    expect(header.indexOf('b')).toBeLessThan(header.indexOf('c'));
  });
});
