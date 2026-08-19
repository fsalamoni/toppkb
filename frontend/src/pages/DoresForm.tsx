import { useState } from 'react';
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
import { ChevronLeft, Save, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormData = {
  data: string;
  regiao: 'cabeca' | 'pescoco' | 'ombro-esq' | 'ombro-dir' | 'braco-esq' | 'braco-dir' | 'cotovelo-esq' | 'cotovelo-dir' | 'punho-esq' | 'punho-dir' | 'costas-cervical' | 'costas-toracica' | 'costas-lombar' | 'quadril' | 'coxa-esq' | 'coxa-dir' | 'joelho-esq' | 'joelho-dir' | 'canela-esq' | 'canela-dir' | 'tornozelo-esq' | 'tornozelo-dir' | 'pe-esq' | 'pe-dir' | 'outro';
  intensidade: number;     // 0-10
  tipo: 'aguda' | 'cronica' | 'muscular' | 'articular' | 'outro';
  ativa: boolean;
  observacoes: string;
  oQueMelhorar: string;
};

const REGIOES: { id: FormData['regiao']; label: string; pos: { x: number; y: number } }[] = [
  { id: 'cabeca', label: 'Cabeça', pos: { x: 50, y: 5 } },
  { id: 'pescoco', label: 'Pescoço', pos: { x: 50, y: 12 } },
  { id: 'ombro-esq', label: 'Ombro Esq.', pos: { x: 28, y: 18 } },
  { id: 'ombro-dir', label: 'Ombro Dir.', pos: { x: 72, y: 18 } },
  { id: 'braco-esq', label: 'Braço Esq.', pos: { x: 22, y: 28 } },
  { id: 'braco-dir', label: 'Braço Dir.', pos: { x: 78, y: 28 } },
  { id: 'cotovelo-esq', label: 'Cotovelo Esq.', pos: { x: 20, y: 36 } },
  { id: 'cotovelo-dir', label: 'Cotovelo Dir.', pos: { x: 80, y: 36 } },
  { id: 'punho-esq', label: 'Punho Esq.', pos: { x: 18, y: 44 } },
  { id: 'punho-dir', label: 'Punho Dir.', pos: { x: 82, y: 44 } },
  { id: 'costas-cervical', label: 'Costas (cervical)', pos: { x: 50, y: 18 } },
  { id: 'costas-toracica', label: 'Costas (torácica)', pos: { x: 50, y: 30 } },
  { id: 'costas-lombar', label: 'Lombar', pos: { x: 50, y: 42 } },
  { id: 'quadril', label: 'Quadril', pos: { x: 50, y: 52 } },
  { id: 'coxa-esq', label: 'Coxa Esq.', pos: { x: 38, y: 60 } },
  { id: 'coxa-dir', label: 'Coxa Dir.', pos: { x: 62, y: 60 } },
  { id: 'joelho-esq', label: 'Joelho Esq.', pos: { x: 38, y: 75 } },
  { id: 'joelho-dir', label: 'Joelho Dir.', pos: { x: 62, y: 75 } },
  { id: 'canela-esq', label: 'Canela Esq.', pos: { x: 38, y: 85 } },
  { id: 'canela-dir', label: 'Canela Dir.', pos: { x: 62, y: 85 } },
  { id: 'tornozelo-esq', label: 'Tornozelo Esq.', pos: { x: 38, y: 95 } },
  { id: 'tornozelo-dir', label: 'Tornozelo Dir.', pos: { x: 62, y: 95 } },
  { id: 'pe-esq', label: 'Pé Esq.', pos: { x: 38, y: 100 } },
  { id: 'pe-dir', label: 'Pé Dir.', pos: { x: 62, y: 100 } },
];

const TIPO_OPCOES = [
  { value: 'aguda', label: 'Aguda', desc: 'Súbita, pós-treino ou impacto' },
  { value: 'cronica', label: 'Crônica', desc: 'Persiste há mais de 3 meses' },
  { value: 'muscular', label: 'Muscular', desc: 'Cansaço, estiramento' },
  { value: 'articular', label: 'Articular', desc: 'Articulação, ligamento' },
  { value: 'outro', label: 'Outro' },
];

export function DoresForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const qc = useQueryClient();
  const [regiaoHover, setRegiaoHover] = useState<string | null>(null);

  const { data: dorExistente, isLoading: loading } = useQuery({
    queryKey: ['dor', id],
    queryFn: async () => {
      if (!id || !user) return null;
      const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'dores', id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
    },
    enabled: !!id && !!user,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      regiao: 'costas-lombar',
      intensidade: 5,
      tipo: 'aguda',
      ativa: true,
      observacoes: '',
      oQueMelhorar: '',
      ...(dorExistente || {}),
    },
  });

  const regiao = watch('regiao');
  const intensidade = watch('intensidade');
  const tipo = watch('tipo');
  const ativa = watch('ativa');

  const intColor = intensidade >= 8 ? 'red' : intensidade >= 5 ? 'amber' : 'emerald';

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Sem usuário');
      const payload = {
        uid: user.uid,
        ...data,
        intensidade: Number(data.intensidade),
        updatedAt: serverTimestamp(),
      };
      if (id) {
        await setDoc(doc(db, 'toppkb_users', user.uid, 'dores', id), payload, { merge: true });
        return 'updated' as const;
      } else {
        await addDoc(collection(db, 'toppkb_users', user.uid, 'dores'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        return 'created' as const;
      }
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['dores', user?.uid] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a === 'created' ? 'Dor registrada' : 'Dor atualizada');
      navigate('/app/dores');
    },
  });

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/dores')}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {id ? 'Editar registro' : 'Registrar dor'}
            </CardTitle>
            <CardDescription>Clique no ponto do corpo para selecionar a região</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MAPA CORPORAL */}
              <div>
                <Label>Mapa corporal (frente)</Label>
                <div className="relative aspect-[1/2] bg-muted/30 rounded-lg overflow-hidden mt-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Silhueta humana simplificada */}
                    <circle cx="50" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="50" y1="11" x2="50" y2="35" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="50" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="50" y1="20" x2="75" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="25" y1="20" x2="20" y2="40" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="75" y1="20" x2="80" y2="40" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="20" y1="40" x2="20" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="80" y1="40" x2="80" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="50" y1="35" x2="40" y2="65" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="50" y1="35" x2="60" y2="65" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="40" y1="65" x2="40" y2="92" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="60" y1="65" x2="60" y2="92" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="40" y1="92" x2="38" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    <line x1="60" y1="92" x2="62" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />

                    {/* Pontos clicáveis */}
                    {REGIOES.map((r) => (
                      <g key={r.id} onClick={() => setValue('regiao', r.id)} onMouseEnter={() => setRegiaoHover(r.id)} onMouseLeave={() => setRegiaoHover(null)} style={{ cursor: 'pointer' }}>
                        <circle
                          cx={r.pos.x}
                          cy={r.pos.y}
                          r={regiao === r.id ? 4 : (regiaoHover === r.id ? 3.5 : 2.5)}
                          fill={regiao === r.id ? 'rgb(239, 68, 68)' : 'rgba(239, 68, 68, 0.5)'}
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Selecionado: <strong>{REGIOES.find((r) => r.id === regiao)?.label}</strong>
                </p>
              </div>

              {/* CAMPOS */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" type="date" {...register('data', { required: true })} />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {TIPO_OPCOES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue('tipo', t.value as any)}
                        className={cn(
                          "text-left p-2 rounded-md border text-xs",
                          tipo === t.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <div className="font-medium">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Intensidade</Label>
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      intColor === 'red' ? 'text-red-600' :
                      intColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                    )}>
                      {intensidade}/10
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    {...register('intensidade', { valueAsNumber: true })}
                    className={cn(
                      "w-full",
                      intColor === 'red' ? 'accent-red-500' :
                      intColor === 'amber' ? 'accent-amber-500' : 'accent-emerald-500'
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0 (nenhuma)</span>
                    <span className="text-red-600">10 (máxima)</span>
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setValue('ativa', true)}
                      className={cn(
                        "flex-1 p-2 rounded-md border text-sm",
                        ativa ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' : 'border-border'
                      )}
                    >
                      🔴 Ativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('ativa', false)}
                      className={cn(
                        "flex-1 p-2 rounded-md border text-sm",
                        !ativa ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'border-border'
                      )}
                    >
                      ✅ Resolvida
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <textarea
                id="obs"
                placeholder="Quando começou? O que causa? O que alivia?"
                {...register('observacoes')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="melhorar">Plano de tratamento / Prevenção</Label>
              <textarea
                id="melhorar"
                placeholder="Alongamentos, gelo, calor, ajuste de treino, fisio..."
                {...register('oQueMelhorar')}
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {intensidade >= 7 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 flex gap-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Dor intensa (≥7/10): considere repouso, avaliação médica e adaptação do treino.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/app/dores')}>
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
