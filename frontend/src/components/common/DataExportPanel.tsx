/**
 * DataExportPanel — UI para LGPD Art. 18,V (direito de portabilidade)
 *
 * Permite ao usuário exportar todos os seus dados em:
 * - JSON único (estruturado, completo)
 * - CSV por coleção (uma planilha por tipo de dado)
 *
 * Inclui:
 * - Status do export
 * - Contadores
 * - Confirmação para dados sensíveis
 */
import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  exportAllUserData,
  downloadJSON,
  exportAllAsCSV,
  estimateSize,
  type ExportData,
} from '@/lib/dataExport';
import { toast } from '@/components/ui/toaster';

interface DataExportPanelProps {
  userId: string;
}

export function DataExportPanel({ userId }: DataExportPanelProps) {
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const handleExport = async () => {
    if (!confirmed) {
      toast.warning('Confirme a checkbox primeiro.');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const result = await exportAllUserData(userId);
      setData(result);
      const sizeMB = estimateSize(result);
      setProgress(100);
      toast.success(
        `Export pronto! ${result.metadados.totalDocumentos} documentos (${sizeMB.toFixed(2)} MB)`,
      );
    } catch (e: any) {
      toast.error('Erro ao exportar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const filename = `toppkb-${data.metadados.uid}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJSON(data, filename);
    toast.success('Download JSON iniciado!');
  };

  const handleDownloadCSV = () => {
    if (!data) return;
    exportAllAsCSV(data);
    toast.success('Downloads CSV iniciados (1 por coleção com dados).');
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-start gap-3 mb-3">
          <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Seus dados (LGPD)</h3>
            <p className="text-sm text-muted-foreground">
              A Lei Geral de Proteção de Dados (LGPD) garante que você pode baixar
              todos os seus dados a qualquer momento.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            Confirmo que desejo exportar todos os meus dados e entendo que o
            download contém informações pessoais.
          </span>
        </label>

        <Button
          onClick={handleExport}
          disabled={!confirmed || loading}
          className="mt-4 w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {loading ? `Exportando... ${progress}%` : 'Exportar meus dados'}
        </Button>
      </div>

      {/* Resultados */}
      {data && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <h4 className="font-medium">Dados coletados</h4>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Documentos</div>
              <div className="text-lg font-bold">{data.metadados.totalDocumentos}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Coleções</div>
              <div className="text-lg font-bold">{data.metadados.totalColecoes}</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>UID: {data.metadados.uid}</div>
            {data.metadados.email && <div>Email: {data.metadados.email}</div>}
            <div>Versão: {data.metadados.versao}</div>
            <div>Data: {new Date(data.metadados.dataExportacao).toLocaleString('pt-BR')}</div>
          </div>

          {/* Coleções com dados */}
          <div>
            <div className="text-sm font-medium mb-1.5">Coleções com dados:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.colecoes)
                .filter(([_, items]) => items.length > 0)
                .map(([name, items]) => (
                  <span
                    key={name}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {name} ({items.length})
                  </span>
                ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleDownloadJSON} size="sm" variant="default">
              <FileJson className="h-4 w-4 mr-1" />
              Baixar JSON único
            </Button>
            <Button onClick={handleDownloadCSV} size="sm" variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Baixar CSVs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
