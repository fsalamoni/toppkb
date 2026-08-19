import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { Plus, Trash2, ExternalLink, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function tsToDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

const TIPO_OPCOES: Record<string, { icone: string; cor: string; label: string }> = {
  artigo: { icone: '📄', cor: 'blue', label: 'Artigo' },
  video: { icone: '🎥', cor: 'red', label: 'Vídeo' },
  livro: { icone: '📚', cor: 'amber', label: 'Livro' },
  podcast: { icone: '🎙️', cor: 'purple', label: 'Podcast' },
  curso: { icone: '🎓', cor: 'emerald', label: 'Curso' },
  outro: { icone: '🔗', cor: 'slate', label: 'Outro' },
};

const TIPO_FORM_OPCOES = Object.entries(TIPO_OPCOES).map(([value, o]) => ({ value, label: `${o.icone} ${o.label}` }));

import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { doc as docFS, addDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

function EstudosForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: item, isLoading: loading } = useQuery({
    queryKey: ['estudo', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(docFS(db, 'toppkb_users', user.uid, 'estudos', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      tipo: 'artigo',
      titulo: '',
      url: '',
      autor: '',
      duracaoMin: 0,
      resumo: '',
      aprendizado: '',
      tags: '',
      ...(item || {}),
    },
  });
  const tipo = watch('tipo');

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error('Sem usuário');
      const tags = (data.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
      const payload = {
        uid: user.uid,
        ...data,
        tags,
        duracaoMin: Number(data.duracaoMin) || 0,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(docFS(db, 'toppkb_users', user.uid, 'estudos', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'estudos'), { ...payload, createdAt: serverTimestamp() });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['estudos', user?.uid] });
      toast.success(a === 'created' ? 'Estudo salvo! 📚' : 'Estudo atualizado!');
      navigate('/app/estudos');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/estudos')}>
        <ChevronLeft className="mr-1 h-4 w-4" />Voltar
      </Button>
      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {TIPO_FORM_OPCOES.map((t) => (
                  <button
                    key={t.value} type="button" onClick={() => setValue('tipo', t.value)}
                    className={cn("text-xs p-2 rounded-md border", tipo === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" placeholder="..." {...register('titulo', { required: true })} />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="url" type="url" placeholder="https://..." {...register('url')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="autor">Autor</Label>
                <Input id="autor" {...register('autor')} />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input id="duracao" type="number" min="0" {...register('duracaoMin')} />
              </div>
            </div>
            <div>
              <Label htmlFor="resumo">Resumo</Label>
              <Textarea id="resumo" rows={2} placeholder="Sobre o que é?" {...register('resumo')} />
            </div>
            <div>
              <Label htmlFor="aprendizado">O que aprendi</Label>
              <Textarea id="aprendizado" rows={3} {...register('aprendizado')} />
            </div>
            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" placeholder="técnica, drop, dink" {...register('tags')} />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/estudos')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />{isEdit ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function Estudos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const { data, isLoading } = useQuery({
    queryKey: ['estudos', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'estudos'),
        orderBy('data', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'toppkb_users', user.uid, 'estudos', id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estudos', user?.uid] });
      toast.success('Estudo removido');
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const estudos = (data || []).filter((e: any) => filtroTipo === 'todos' || e.tipo === filtroTipo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estudos</h1>
          <p className="text-sm text-muted-foreground">Artigos, vídeos, livros, podcasts</p>
        </div>
        <Button asChild>
          <Link to="/app/estudos/novo"><Plus className="mr-2 h-4 w-4" />Novo</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={cn("text-xs px-2.5 py-1 rounded-full border",
            filtroTipo === 'todos' ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}
        >Todos</button>
        {Object.entries(TIPO_OPCOES).map(([key, o]) => (
          <button
            key={key} onClick={() => setFiltroTipo(key)}
            className={cn("text-xs px-2.5 py-1 rounded-full border",
              filtroTipo === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}
          >{o.icone} {o.label}</button>
        ))}
      </div>

      {estudos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icone="📚"
              titulo="Nenhum estudo salvo"
              descricao="Salve artigos, vídeos e livros que te ajudam a evoluir no pickleball."
              acao={
                <Button asChild>
                  <Link to="/app/estudos/novo"><Plus className="mr-2 h-4 w-4" />Salvar primeiro</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {estudos.map((e: any) => {
            const tipo = TIPO_OPCOES[e.tipo] || TIPO_OPCOES.outro;
            return (
              <Card key={e.id} className="hover:border-primary/30 transition group">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{tipo.icone}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{e.titulo}</h3>
                          <p className="text-xs text-muted-foreground">
                            {e.autor && `${e.autor} · `}{tsToDate(e.data)?.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => del.mutate(e.id)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      {e.resumo && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.resumo}</p>}
                      {e.tags && e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {e.tags.map((t: string) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {e.url && (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link to={`/app/estudos/${e.id}`} className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { EstudosForm };
