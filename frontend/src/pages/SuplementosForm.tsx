import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/LoadingScreen';
import { toast } from '@/components/ui/toaster';
import { ChevronLeft, Save, Pill, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  nome: string;
  dose: string;
  unidade: string;
  horario: 'cafe' | 'almoco' | 'jantar' | 'pre-treino' | 'pos-treino' | 'ao-deitar' | 'outro';
  comAlimento: boolean;
  frequencia: 'diario' | 'semanal' | 'ciclico' | 'eventual';
  efeitoPercebido: number;
  observacoes: string;
};

const SUPLEMENTOS_COMUNS: Record<string, { dosePadrao: string; beneficios: string; alerta50mais?: string }> = {
  'creatina': {
    dosePadrao: '5g',
    beneficios: 'Força, potência, recuperação. Bem estudada para 50+.',
    alerta50mais: 'Pode ajudar a preservar massa muscular (sarcopenia). Tome sempre com água.',
  },
  'whey-protein': {
    dosePadrao: '25-30g',
    beneficios: 'Completar meta de proteína. Praticidade pós-treino.',
    alerta50mais: 'Para 50+, meta de 1.6-2.2g/kg/dia de proteína ajuda a combater sarcopenia.',
  },
  'colageno': {
    dosePadrao: '10-15g',
    beneficios: 'Saúde articular, tendões, ligamentos.',
    alerta50mais: 'Combine com vitamina C para melhor absorção. Resultados em 8-12 semanas.',
  },
  'vitamina-d3': {
    dosePadrao: '2000-5000 UI',
    beneficios: 'Saúde óssea, imunidade, humor. Deficiência é comum.',
    alerta50mais: 'Absorção de D3 cai com idade. Nível sérico ideal: 40-60 ng/mL.',
  },
  'omega-3': {
    dosePadrao: '2-3g',
    beneficios: 'Anti-inflamatório natural, cardiovascular, cognitivo.',
    alerta50mais: 'Protege coração, articulações. EPA+DHA, não óleo de peixe comum.',
  },
  'magnesio': {
    dosePadrao: '200-400mg',
    beneficios: 'Câimbra, sono, recuperação muscular.',
    alerta50mais: 'Bisglicinato é a forma com melhor absorção. Tome à noite para melhorar sono.',
  },
  'cafeina': {
    dosePadrao: '100-200mg',
    beneficios: 'Performance, foco, energia pré-treino.',
  },
  'beta-alanina': {
    dosePadrao: '3-6g',
    beneficios: 'Resistência muscular, tamponamento ácido lático.',
  },
  'citrulina': {
    dosePadrao: '6-8g',
    beneficios: 'Pump, performance, recuperação.',
  },
  'bcaa': {
    dosePadrao: '5-10g',
    beneficios: 'Recuperação, redução de catabolismo.',
  },
  'multivitaminico': {
    dosePadrao: '1 dose',
    beneficios: 'Cobertura de micronutrientes básicos.',
    alerta50mais: 'Para 50+, considere formulações específicas para sua idade.',
  },
  'zinco': {
    dosePadrao: '15-30mg',
    beneficios: 'Imunidade, testosterona, recuperação.',
  },
  'vitamina-c': {
    dosePadrao: '500-1000mg',
    beneficios: 'Antioxidante, imunidade, ajuda na absorção de colágeno.',
  },
  'b12': {
    dosePadrao: '1000mcg',
    beneficios: 'Energia, sistema nervoso. Absorção cai com idade.',
    alerta50mais: 'Crucial para 50+. Tome sublingual para melhor absorção.',
  },
  'glucosamina': {
    dosePadrao: '1500mg',
    beneficios: 'Saúde articular, cartilagem.',
    alerta50mais: 'Resultados demoram 8-12 semanas. Combinar com condroitina.',
  },
};

const HORARIO_OPCOES: Array<{ value: FormData['horario']; label: string; icon: string; cor: string }> = [
  { value: 'cafe', label: 'Café', icon: '☕', cor: 'amber' },
  { value: 'almoco', label: 'Almoço', icon: '🍽️', cor: 'orange' },
  { value: 'jantar', label: 'Jantar', icon: '🌙', cor: 'indigo' },
  { value: 'pre-treino', label: 'Pré-treino', icon: '🏓', cor: 'red' },
  { value: 'pos-treino', label: 'Pós-treino', icon: '💪', cor: 'blue' },
  { value: 'ao-deitar', label: 'Ao deitar', icon: '😴', cor: 'violet' },
  { value: 'outro', label: 'Outro', icon: '⏰', cor: 'slate' },
];

const FREQUENCIA_OPCOES: Array<{ value: FormData['frequencia']; label: string; desc: string }> = [
  { value: 'diario', label: '📅 Diário', desc: 'Todos os dias' },
  { value: 'semanal', label: '🗓 Semanal', desc: 'Alguns dias por semana' },
  { value: 'ciclico', label: '🔄 Cíclico', desc: 'Com pausas programadas' },
  { value: 'eventual', label: '🎯 Eventual', desc: 'Quando sentir necessidade' },
];

export function SuplementosForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: item, isLoading: loading } = useQuery({
    queryKey: ['suplemento', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'suplementos', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      nome: '',
      dose: '',
      unidade: 'g',
      horario: 'cafe',
      comAlimento: true,
      frequencia: 'diario',
      efeitoPercebido: 5,
      observacoes: '',
      ...(item || {}),
    },
  });

  const nome = watch('nome') || '';
  const horario = watch('horario');
  const frequencia = watch('frequencia');
  const efeitoPercebido = watch('efeitoPercebido');
  const supleSugerido = SUPLEMENTOS_COMUNS[nome.toLowerCase()];

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        efeitoPercebido: Number(data.efeitoPercebido) || 0,
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'suplementos', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'suplementos'), { ...payload, createdAt: serverTimestamp() });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['suplementos', user?.uid] });
      toast.success(a === 'created' ? 'Suplemento registrado! 💊' : 'Suplemento atualizado!');
      navigate('/app/suplementos');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/suplementos')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              {isEdit ? 'Editar suplemento' : 'Registrar suplemento'}
            </CardTitle>
            <CardDescription>Controle de suplementação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register('data', { required: true })} />
            </div>

            <div>
              <Label htmlFor="nome">Suplemento</Label>
              <Input
                id="nome"
                list="suplementos-comuns"
                placeholder="creatina, colágeno, vitamina D3..."
                {...register('nome', { required: true })}
              />
              <datalist id="suplementos-comuns">
                {Object.keys(SUPLEMENTOS_COMUNS).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {supleSugerido && (
                <div className="mt-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <p><strong>{nome}:</strong> {supleSugerido.beneficios}</p>
                  <p className="text-muted-foreground">Dose padrão: {supleSugerido.dosePadrao}</p>
                  {supleSugerido.alerta50mais && (
                    <p className="text-amber-600 dark:text-amber-400">
                      <Info className="inline h-3 w-3 mr-1" />
                      {supleSugerido.alerta50mais}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dose">Dose + unidade</Label>
              <div className="flex gap-2">
                <Input
                  id="dose"
                  type="text"
                  placeholder="5"
                  className="flex-1"
                  {...register('dose', { required: true })}
                />
                <select
                  {...register('unidade')}
                  className="rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="g">g</option>
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="UI">UI</option>
                  <option value="ml">ml</option>
                  <option value="cp">cápsula</option>
                  <option value="dose">dose</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Horário de uso</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {HORARIO_OPCOES.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => setValue('horario', h.value)}
                    className={cn(
                      "p-3 rounded-md border text-sm transition-all text-left",
                      horario === h.value
                        ? 'border-primary bg-primary/5 font-semibold'
                        : 'border-border hover:border-primary/30',
                    )}
                  >
                    <div className="text-lg">{h.icon}</div>
                    <div>{h.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Frequência</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {FREQUENCIA_OPCOES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setValue('frequencia', f.value)}
                    className={cn(
                      "p-2.5 rounded-md border text-left text-sm transition-all",
                      frequencia === f.value
                        ? 'border-primary bg-primary/5 font-semibold'
                        : 'border-border hover:border-primary/30',
                    )}
                  >
                    <div>{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('comAlimento')} className="h-4 w-4 rounded" />
                <span>Tomar com alimento</span>
              </label>
            </div>

            <div>
              <Label htmlFor="efeito">Efeito percebido (1-10): {efeitoPercebido}/10</Label>
              <input
                id="efeito"
                type="range"
                min="1"
                max="10"
                {...register('efeitoPercebido', { valueAsNumber: true })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Nenhum</span>
                <span>Excelente</span>
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Como se sentiu? Algum efeito colateral? Marca?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground flex gap-1 p-2 rounded-md bg-blue-500/10 border border-blue-500/30">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica para 50+:</strong> alguns suplementos têm absorção reduzida com a idade
                (B12, D3, magnésio). Converse com médico/nutricionista antes de iniciar protocolos longos.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/suplementos')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting || saveMutation.isPending ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
