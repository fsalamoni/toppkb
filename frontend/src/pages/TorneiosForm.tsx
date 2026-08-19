import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Trophy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  nome: string;
  dataInicio: string;
  dataFim: string;
  local: string;
  cidade: string;
  estado: string;
  tipo: 'estadual' | 'brasileiro' | 'sul-americano' | 'mundial' | 'amistoso' | 'outro';
  categoria: '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | 'open' | 'idade-50' | 'idade-55' | 'idade-60';
  modalidade: 'simples' | 'duplas' | 'misto' | 'equipe';
  status: 'agendado' | 'inscrito' | 'em-andamento' | 'concluido' | 'cancelado';
  resultadoFinal?: string;
  colocacao?: number;
  investimento: number;
  observacoes: string;
  url: string;
};

const TIPO_OPCOES = ['estadual', 'brasileiro', 'sul-americano', 'mundial', 'amistoso', 'outro'];
const CATEGORIA_OPCOES = ['3.0', '3.5', '4.0', '4.5', '5.0', 'open', 'idade-50', 'idade-55', 'idade-60'];
const MODALIDADE_OPCOES = ['simples', 'duplas', 'misto', 'equipe'];
const STATUS_OPCOES = ['agendado', 'inscrito', 'em-andamento', 'concluido', 'cancelado'];

export function TorneiosForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();

  const { data: torneioExistente, isLoading: loading } = useQuery({
    queryKey: ['torneio', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'torneios', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      nome: '',
      dataInicio: new Date().toISOString().slice(0, 10),
      dataFim: '',
      local: '',
      cidade: '',
      estado: '',
      tipo: 'estadual',
      categoria: 'idade-50',
      modalidade: 'duplas',
      status: 'agendado',
      investimento: 0,
      observacoes: '',
      url: '',
      ...(torneioExistente || {}),
    },
  });

  const tipo = watch('tipo');
  const status = watch('status');

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        investimento: Number(data.investimento),
        colocacao: data.colocacao ? Number(data.colocacao) : null,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'torneios', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'torneios'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['torneios', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Torneio agendado! 🏆' : 'Torneio atualizado!');
      navigate('/app/torneios');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/torneios')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {id ? 'Editar torneio' : 'Novo torneio'}
            </CardTitle>
            <CardDescription>Planejamento, inscrição e resultados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do torneio</Label>
              <Input id="nome" placeholder="Open Brasil 50+ - 2026" {...register('nome', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dataInicio">Data início</Label>
                <Input id="dataInicio" type="date" {...register('dataInicio', { required: true })} />
              </div>
              <div>
                <Label htmlFor="dataFim">Data fim</Label>
                <Input id="dataFim" type="date" {...register('dataFim')} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 md:col-span-1">
                <Label htmlFor="local">Local</Label>
                <Input id="local" placeholder="Clube A" {...register('local')} />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" placeholder="São Paulo" {...register('cidade')} />
              </div>
              <div>
                <Label htmlFor="estado">UF</Label>
                <Input id="estado" maxLength={2} placeholder="SP" {...register('estado')} />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TIPO_OPCOES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('tipo', t as any)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border",
                      tipo === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIA_OPCOES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('categoria', c as any)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border",
                      watch('categoria') === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Modalidade</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {MODALIDADE_OPCOES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setValue('modalidade', m as any)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border",
                      watch('modalidade') === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STATUS_OPCOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('status', s as any)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border",
                      status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="investimento">Investimento (R$)</Label>
                <Input id="investimento" type="number" step="0.01" {...register('investimento')} />
              </div>
              <div>
                <Label htmlFor="colocacao">Colocação</Label>
                <Input id="colocacao" type="number" placeholder="1" {...register('colocacao')} />
              </div>
            </div>
            <div>
              <Label htmlFor="resultado">Resultado final</Label>
              <Input id="resultado" placeholder="Vice-campeão" {...register('resultadoFinal')} />
            </div>
            <div>
              <Label htmlFor="url">URL / mais informações</Label>
              <Input id="url" type="url" placeholder="https://..." {...register('url')} />
            </div>
            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Estratégia, adversários conhecidos, logística..."
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground flex gap-1">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Adicione o torneio à agenda com antecedência para se preparar fisicamente.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/torneios')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar' : 'Salvar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
