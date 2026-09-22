/**
 * dataExport.ts — exporta todos os dados do usuário (LGPD compliance)
 *
 * LGPD Art. 18, V: direito do titular de obter seus dados em formato
 * estruturado e portátil. Implementamos aqui a exportação completa.
 *
 * Inclui:
 * - Perfil
 * - Todas as coleções (treinos, partidas, etc)
 * - Metadados (data de exportação, versão do schema)
 *
 * Formatos: JSON (completo) e CSV (por coleção)
 */
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/asyncUtils';

export interface ExportData {
  metadados: {
    versao: string;
    dataExportacao: string;
    uid: string;
    email?: string;
    totalColecoes: number;
    totalDocumentos: number;
  };
  perfil: Record<string, any> | null;
  colecoes: Record<string, any[]>;
}

// Coleções que o user tem em toppkb_users/{uid}/
const USER_COLLECTIONS = [
  'treinos',
  'partidas',
  'preparacao',
  'nutricao',
  'sono',
  'peso',
  'medidas',
  'dores',
  'lesoes',
  'suplementos',
  'torneios',
  'metas',
  'estudos',
  'hidratacao',
  'treinamento_sessoes',
  'treinamento_planos',
  'treinamento_metas',
  'treinamento_avaliacoes',
  'treinamento_prs',
  'treinamento_composicao',
  'treinamento_notas',
  'treinamento_templates',
  'push',
];

/**
 * Coleta TODOS os dados do usuário
 */
export async function exportAllUserData(uid: string): Promise<ExportData> {
  // Perfil
  let perfil: any = null;
  try {
    const profileSnap = await withTimeout(
      getDoc(doc(db, `toppkb_users/${uid}/profile/main`)),
      5000,
      'profile',
    );
    if (profileSnap.exists()) {
      perfil = profileSnap.data();
    }
  } catch {
    // ignore
  }

  // Coleções em paralelo
  const results = await Promise.all(
    USER_COLLECTIONS.map(async (name) => {
      try {
        const snap = await withTimeout(
          getDocs(collection(db, `toppkb_users/${uid}/${name}`)),
          8000,
          name,
        );
        return [name, snap.docs.map((d) => ({ id: d.id, ...d.data() }))] as const;
      } catch (e) {
        console.warn(`[dataExport] failed to fetch ${name}:`, e);
        return [name, []] as const;
      }
    }),
  );

  const colecoes: Record<string, any[]> = {};
  let totalDocumentos = 0;
  for (const [name, items] of results) {
    colecoes[name] = items as any[];
    totalDocumentos += items.length;
  }

  return {
    metadados: {
      versao: '1.0',
      dataExportacao: new Date().toISOString(),
      uid,
      email: perfil?.email,
      totalColecoes: USER_COLLECTIONS.length,
      totalDocumentos,
    },
    perfil,
    colecoes,
  };
}

/**
 * Converte JSON para Blob e dispara download
 */
export function downloadJSON(data: any, filename: string = 'toppkb-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Converte array para CSV
 */
export function convertToCSV(items: any[]): string {
  if (items.length === 0) return '';

  // Coletar todas as chaves
  const keys = new Set<string>();
  for (const item of items) {
    for (const k of Object.keys(item)) keys.add(k);
  }
  const allKeys = Array.from(keys);

  // Header
  const header = allKeys.map(escape).join(',');

  // Rows
  const rows = items.map((item) =>
    allKeys
      .map((k) => {
        const value = item[k];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return escape(String(value));
      })
      .join(','),
  );

  return [header, ...rows].join('\n');
}

function escape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converte ExportData para múltiplos CSVs (um por coleção)
 */
export function exportAllAsCSV(data: ExportData): void {
  for (const [name, items] of Object.entries(data.colecoes)) {
    if (items.length === 0) continue;
    const csv = convertToCSV(items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toppkb-${name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Estima tamanho do export (em MB)
 */
export function estimateSize(data: ExportData): number {
  const json = JSON.stringify(data);
  return json.length / (1024 * 1024);
}
