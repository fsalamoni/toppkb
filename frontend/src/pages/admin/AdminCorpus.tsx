import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Upload, Trash2, FileText } from 'lucide-react';
import { adminListDocuments, adminGetStats } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';

export function AdminCorpus() {
  const [docs, setDocs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const addToast = useUIStore((s) => s.addToast);

  const load = async () => {
    setLoading(true);
    try {
      const [docsData, statsData] = await Promise.all([
        adminListDocuments({ limit: 50 }),
        adminGetStats(),
      ]);
      setDocs(docsData.items || []);
      setStats(statsData);
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro ao carregar: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = docs.filter((d) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      (d.titulo || '').toLowerCase().includes(q) ||
      (d.summary || '').toLowerCase().includes(q) ||
      (d.classification?.natureza || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Corpus</h1>
        <p className="text-sm text-muted-foreground">Documentos indexados para RAG (busca semântica).</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <p className="text-2xl font-bold">{stats.documents || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Chunks</p>
              <p className="text-2xl font-bold">{stats.chunks || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Fontes</p>
              <p className="text-2xl font-bold">{stats.sources || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Usuários</p>
              <p className="text-2xl font-bold">{stats.users || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>{filtered.length} de {docs.length}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento encontrado</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => (
                <div key={d.id} className="flex items-start justify-between border border-border rounded p-3">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{d.titulo || 'Sem título'}</p>
                      {d.summary && <p className="text-xs text-muted-foreground line-clamp-1">{d.summary}</p>}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {d.classification?.natureza && <Badge variant="outline">{d.classification.natureza}</Badge>}
                        {d.status && <Badge variant={d.status === 'active' ? 'success' : 'secondary'}>{d.status}</Badge>}
                        {d.createdAt && (
                          <span>{format(new Date(d.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCorpus;
