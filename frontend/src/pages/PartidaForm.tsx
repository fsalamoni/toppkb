import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, addDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';

type FormData = {
  data: string;
  tipo: 'amistosa' | 'ranking' | 'torneio' | 'duplas' | 'simples' | 'misto';
  adversario: string;
  adversarioNivel: string;
  placar: string;
  sets: string;
  duracaoMin: number;
  resultado: 'vitoria' | 'derrota' | 'empate';
  ladoDominante: 'destro' | 'canhoto' | 'ambidestro';
  winners: number;
  unforcedErrors: number;
  pontosFortes: string;
  pontosFracos: string;
  aprendizados: string;
  proximaEstrategia: string;
  observacoes: string;
};

const TIPO_OPCOES = [
  { value: 'amistosa', label: 'Amistosa', desc: 'Treino entre amigos' },
  { value: 'ranking', label: 'Ranking', desc: 'Partida de ranking oficial' },
  { value: 'torneio', label: 'Torneio', desc: 'Competição formal' },
  { value: 'duplas', label: 'Duplas', desc: 'Partida em duplas' },
  { value: 'simples', label: 'Simples', desc: 'Partida individual' },
  { value: 'misto', label: 'Misto', desc: 'Duplas mistas (M+F)' },
];

const NIVEL_OPCOES = ['Iniciante', 'Iniciante-Bom', 'Intermediário', 'Avançado', 'Pro'];
const LADO_OPCOES = [
  { value: 'destro', label: '🤚 Destro' },
  { value: 'canhoto', label: '✋ Canhoto' },
  { value: 'ambidestro', label: '🤚✋ Ambidestro' },
];

export function PartidaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [setsList, setSetsList] = useState<string[]>(['']);

  // Se tiver id, é edição
  const { data: partidaExistente, isLoading: loadingPartida } = useQuery({
    queryKey: ['partida', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'partidas', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      tipo: 'amistosa',
      adversario: '',
      adversarioNivel: '',
      placar: '',
      sets: '',
      duracaoMin: 30,
      resultado: 'vitoria',
      ladoDominante: 'destro',
      winners: 0,
      unforcedErrors: 0,
      pontosFortes: '',
      pontosFracos: '',
      aprendizados: '',
      proximaEstrategia: '',
      observacoes: '',
      ...(partidaExistente || {}),
      ...(partidaExistente?.data && {
        data: typeof partidaExistente.data === 'string'
          ? partidaExistente.data.slice(0, 16)
          : new Date(partidaExistente.data?.toDate?.() || partidaExistente.data).toISOString().slice(0, 16)
      }),
    },
  });

  const tipo = watch('tipo');
  const resultado = watch('resultado');
  const adversarioNivel = watch('adversarioNivel');

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        data: new Date(data.data).toISOString(),
        duracaoMin: Number(data.duracaoMin),
        winners: Number(data.winners),
        unforcedErrors: Number(data.unforcedErrors),
        setsList: setsList.filter((s) => s.trim()),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'partidas', id), payload, { merge: true });
        return { action: 'updated' as const };
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'partidas'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return { action: 'created' as const };
      }
    },
    onSuccess: ({ action }) => {
      qc.invalidateQueries({ queryKey: ['partidas', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(action === 'created' ? 'Partida registrada! 🎾' : 'Partida atualizada!');
      navigate('/app/partidas');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const onSubmit = (data: FormData) => saveMutation.mutate(data);

  if (loadingPartida) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/partidas')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ============ BÁSICO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Editar partida' : 'Nova partida'}</CardTitle>
            <CardDescription>Registre sua partida para acompanhar evolução</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data">Data e hora</Label>
                <Input id="data" type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="1"
                  step="5"
                  {...register('duracaoMin', { required: true, min: 1 })}
                />
              </div>
            </div>

            <div>
              <Label>Tipo de partida</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {TIPO_OPCOES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('tipo', t.value as any)}
                    className={`text-left p-3 rounded-lg border-2 transition ${
                      tipo === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="adversario">Adversário(a)</Label>
              <Input
                id="adversario"
                placeholder="Nome ou apelido"
                {...register('adversario', { required: true })}
              />
            </div>

            <div>
              <Label>Nível do adversário</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {NIVEL_OPCOES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setValue('adversarioNivel', n)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      adversarioNivel === n
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Lado dominante (seu)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LADO_OPCOES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setValue('ladoDominante', l.value as any)}
                    className={`text-sm px-3 py-1.5 rounded-md border ${
                      watch('ladoDominante') === l.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ RESULTADO ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Resultado</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'vitoria', label: '✅ Vitória', bg: 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10' },
                  { value: 'empate', label: '🤝 Empate', bg: 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10' },
                  { value: 'derrota', label: '❌ Derrota', bg: 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('resultado', r.value as any)}
                    className={`p-3 rounded-lg border-2 font-medium transition ${
                      resultado === r.value
                        ? `${r.bg} border-current`
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="placar">Placar final</Label>
                <Input
                  id="placar"
                  placeholder="11-9, 8-11, 11-7"
                  {...register('placar')}
                />
              </div>
              <div>
                <Label htmlFor="sets">Sets (opcional)</Label>
                <Input
                  id="sets"
                  placeholder="2-1"
                  {...register('sets')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="winners">Winners (acertos definitivos)</Label>
                <Input
                  id="winners"
                  type="number"
                  min="0"
                  {...register('winners', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Smash, voleio winner, passing shot, drop winner
                </p>
              </div>
              <div>
                <Label htmlFor="unforcedErrors">Erros não forçados</Label>
                <Input
                  id="unforcedErrors"
                  type="number"
                  min="0"
                  {...register('unforcedErrors', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bola na rede, bola fora, ataque mal medido
                </p>
              </div>
            </div>

            <div>
              <Label>Sets jogados</Label>
              <div className="space-y-2 mt-2">
                {setsList.map((set, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Set ${i + 1}: 11-9`}
                      value={set}
                      onChange={(e) => {
                        const newSets = [...setsList];
                        newSets[i] = e.target.value;
                        setSetsList(newSets);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSetsList(setsList.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSetsList([...setsList, ''])}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar set
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ ANÁLISE ============ */}
        <Card>
          <CardHeader>
            <CardTitle>Análise tática</CardTitle>
            <CardDescription>O que funcionou? O que melhorar? Aprendizados?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fortes">Pontos fortes</Label>
              <Textarea
                id="fortes"
                placeholder="Dink consistente, leitura de jogo, posicionamento..."
                rows={2}
                {...register('pontosFortes')}
              />
            </div>
            <div>
              <Label htmlFor="fracos">Pontos fracos / A melhorar</Label>
              <Textarea
                id="fracos"
                placeholder="3rd shot drop caindo na rede, smash sem variar ângulo..."
                rows={2}
                {...register('pontosFracos')}
              />
            </div>
            <div>
              <Label htmlFor="aprendizados">Aprendizados</Label>
              <Textarea
                id="aprendizados"
                placeholder="Adversário esperava meu drop longo → drop curto. Funcionou."
                rows={2}
                {...register('aprendizados')}
              />
            </div>
            <div>
              <Label htmlFor="estrategia">Estratégia para a próxima</Label>
              <Textarea
                id="estrategia"
                placeholder="Trabalhar mais 3rd shot drive, varied shot placement..."
                rows={2}
                {...register('proximaEstrategia')}
              />
            </div>
            <div>
              <Label htmlFor="obs">Observações livres</Label>
              <Textarea
                id="obs"
                placeholder="Clima, quadra, torcida, lesões, humor..."
                rows={2}
                {...register('observacoes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ============ AÇÕES ============ */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/partidas')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (id ? 'Atualizar partida' : 'Salvar partida')}
          </Button>
        </div>
      </form>
    </div>
  );
}
