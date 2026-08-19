import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Input não usado
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Droplets, Plus, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  totalMl: number;
  // copo 200ml
  coposPequenos: number;
  coposMedios: number;
  coposGrandes: number;
  observacoes: string;
};

function tsToDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function HidratacaoForm() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const hoje = new Date();
  const dataKey = tsToDateKey(hoje);

  // Buscar registro de hoje
  const { data: registroHoje, isLoading: loading } = useQuery({
    queryKey: ['hidratacao-hoje', user?.uid, dataKey],
    queryFn: async () => {
      if (!user) return null;
      const q = query(
        collection(db, 'toppkb_users', user.uid, 'hidratacao'),
        where('data', '==', dataKey),
        limit(1),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as any;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: dataKey,
      totalMl: registroHoje?.totalMl ?? 0,
      coposPequenos: registroHoje?.coposPequenos ?? 0,
      coposMedios: registroHoje?.coposMedios ?? 0,
      coposGrandes: registroHoje?.coposGrandes ?? 0,
      observacoes: registroHoje?.observacoes ?? '',
    },
  });

  const coposPequenos = watch('coposPequenos') || 0;
  const coposMedios = watch('coposMedios') || 0;
  const coposGrandes = watch('coposGrandes') || 0;
  const totalMlCalculado = (coposPequenos * 200) + (coposMedios * 350) + (coposGrandes * 500);

  // Meta baseada no peso (35ml/kg) ou fixa
  const peso = userDoc?.pesoInicial || 80;
  const metaMl = Math.round(peso * 35);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        data: dataKey,
        totalMl: totalMlCalculado,
        coposPequenos: Number(data.coposPequenos) || 0,
        coposMedios: Number(data.coposMedios) || 0,
        coposGrandes: Number(data.coposGrandes) || 0,
        observacoes: data.observacoes,
        updatedAt: serverTimestamp(),
      };
      if (registroHoje?.id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'hidratacao', registroHoje.id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'hidratacao'), { ...payload, createdAt: serverTimestamp() });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['hidratacao-hoje', user?.uid] });
      qc.invalidateQueries({ queryKey: ['hidratacao', user?.uid] });
      qc.invalidateQueries({ queryKey: ['sidebar-badges', user?.uid] });
      toast.success(a === 'created' ? 'Hidratação registrada! 💧' : 'Hidratação atualizada!');
      navigate('/app/hidratacao');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const progresso = Math.min(100, Math.round((totalMlCalculado / metaMl) * 100));
  const corBarra = progresso >= 100 ? 'emerald' : progresso >= 70 ? 'blue' : progresso >= 40 ? 'amber' : 'red';

  function addCopo(tipo: 'P' | 'M' | 'G', delta: number) {
    if (tipo === 'P') setValue('coposPequenos', Math.max(0, (coposPequenos || 0) + delta));
    if (tipo === 'M') setValue('coposMedios', Math.max(0, (coposMedios || 0) + delta));
    if (tipo === 'G') setValue('coposGrandes', Math.max(0, (coposGrandes || 0) + delta));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/hidratacao')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              {registroHoje ? 'Atualizar' : 'Registrar'} hidratação de hoje
            </CardTitle>
            <CardDescription>
              {dataKey.split('-').reverse().join('/')} · Meta: {metaMl}ml ({Math.round(metaMl / 250)} copos de 250ml)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progresso visual */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{totalMlCalculado}ml / {metaMl}ml</span>
                <span className={cn(
                  "text-sm font-bold",
                  corBarra === 'emerald' ? 'text-emerald-600' :
                  corBarra === 'blue' ? 'text-blue-600' :
                  corBarra === 'amber' ? 'text-amber-600' : 'text-red-600'
                )}>
                  {progresso}%
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    corBarra === 'emerald' ? 'bg-emerald-500' :
                    corBarra === 'blue' ? 'bg-blue-500' :
                    corBarra === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${progresso}%` }}
                />
              </div>
              {progresso < 50 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex gap-1">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>Hidratação baixa! Beba água regularmente.</span>
                </p>
              )}
            </div>

            {/* Contador de copos */}
            <div className="space-y-3">
              <ContadorCopo
                label="Copo pequeno"
                sublabel="200ml"
                icone="🥛"
                valor={coposPequenos}
                onAdd={() => addCopo('P', 1)}
                onSub={() => addCopo('P', -1)}
              />
              <ContadorCopo
                label="Copo médio"
                sublabel="350ml (caneca)"
                icone="☕"
                valor={coposMedios}
                onAdd={() => addCopo('M', 1)}
                onSub={() => addCopo('M', -1)}
              />
              <ContadorCopo
                label="Copo grande / garrafa"
                sublabel="500ml"
                icone="🍶"
                valor={coposGrandes}
                onAdd={() => addCopo('G', 1)}
                onSub={() => addCopo('G', -1)}
              />
            </div>

            <input type="hidden" {...register('data')} />

            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Treinou mais? Ficou no sol? Temperatura?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground flex gap-1 p-2 rounded-md bg-cyan-500/10 border border-cyan-500/30">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Para 50+:</strong> sensação de sede diminui com a idade. Beba água antes de sentir sede.
                Adicione sal marinho ou eletrólitos em dias de treino intenso. Evite esperar até a garganta secar.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/hidratacao')} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ContadorCopo({ label, sublabel, icone, valor, onAdd, onSub }: {
  label: string;
  sublabel: string;
  icone: string;
  valor: number;
  onAdd: () => void;
  onSub: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
      <div className="text-2xl">{icone}</div>
      <div className="flex-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onSub}
          disabled={valor <= 0}
          className="h-8 w-8"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-lg font-bold tabular-nums w-8 text-center">{valor}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAdd}
          className="h-8 w-8"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
