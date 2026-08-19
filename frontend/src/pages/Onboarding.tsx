import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calcularIMC } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

const schema = z.object({
  ladoDominante: z.enum(['destro', 'canhoto']),
  cidade: z.string().min(2).optional().or(z.literal('')),
  estado: z.string().length(2).optional().or(z.literal('')),
  parceiroDuplas: z.string().optional().or(z.literal('')),
  tempoDeJogoMeses: z.coerce.number().min(0).max(600).optional(),
  outrosEsportes: z.string().optional().or(z.literal('')),
  pesoAtual: z.coerce.number({ invalid_type_error: 'Informe um número' }).min(40, 'Mínimo 40kg').max(250, 'Máximo 250kg'),
  altura: z.coerce.number({ invalid_type_error: 'Informe um número' }).min(120, 'Mínimo 120cm').max(230, 'Máximo 230cm'),
  pesoMeta: z.coerce.number({ invalid_type_error: 'Informe um número' }).min(40, 'Mínimo 40kg').max(150, 'Máximo 150kg'),
});

type FormData = z.infer<typeof schema>;

/** Helper de timeout para evitar que setDoc pendure */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout após ${ms}ms`)), ms),
    ),
  ]);
}

export function Onboarding() {
  const { user, userDoc, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Garante que consent foi aceito antes de mostrar onboarding
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const hasConsent = userDoc?.consent === true || (userDoc?.consent && typeof userDoc.consent === 'object');
    if (!hasConsent) {
      navigate('/app/consent', { replace: true });
    }
  }, [user, userDoc, loading, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      ladoDominante: 'destro',
      pesoAtual: userDoc?.pesoInicial || 95,
      altura: userDoc?.altura || 179,
      pesoMeta: userDoc?.pesoMeta || 80,
    },
  });

  const watched = watch();
  const imcCalculado = watched.pesoAtual && watched.altura ? calcularIMC(watched.pesoAtual, watched.altura) : null;

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSubmitError('Você não está logado. Faça login novamente.');
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      const profileData: Record<string, any> = {
        uid: user.uid,
        email: user.email || null,
        displayName: userDoc?.displayName || user.email?.split('@')[0] || 'Atleta',
        onboardingComplete: true,
        ladoDominante: data.ladoDominante,
        cidade: data.cidade || null,
        estado: data.estado?.toUpperCase() || null,
        parceiroDuplas: data.parceiroDuplas || null,
        tempoDeJogoMeses: data.tempoDeJogoMeses || null,
        outrosEsportes: data.outrosEsportes
          ? data.outrosEsportes.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        pesoInicial: data.pesoAtual,
        altura: data.altura,
        imcInicial: imcCalculado,
        nivelInicial: 'iniciante-bom',
        objetivoFinal: 'Top 1 do Brasil 50+ em 2032',
        prazoMeses: 72,
        pesoMeta: data.pesoMeta,
        updatedAt: serverTimestamp(),
        updatedAtIso: new Date().toISOString(),
      };

      // Seta com timeout 8s — Firestore pode pendurar
      await withTimeout(
        setDoc(
          doc(db, 'toppkb_users', user.uid, 'profile', 'main'),
          profileData,
          { merge: true },
        ),
        8000,
        'Salvamento do perfil',
      );

      toast({ title: 'Perfil completo!', description: 'Bem-vindo à jornada 🎯', variant: 'success' });
      // Força navegação — usa replace para não permitir voltar
      navigate('/app/dashboard', { replace: true });
    } catch (e: any) {
      console.error('[onboarding] erro ao salvar:', e);
      const msg = e?.message || 'Erro desconhecido';
      setSubmitError(msg);
      toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /** Força a finalização mesmo se o setDoc falhou (ex: timeout).
   *  Marca onboardingComplete localmente e navega. */
  const forceFinish = () => {
    toast({
      title: 'Finalizando sem salvar',
      description: 'Você pode completar o perfil depois em Configurações.',
    });
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configurando seu perfil ({step}/3)</CardTitle>
          <CardDescription>Vamos começar pelo essencial</CardDescription>
        </CardHeader>
        <CardContent>
          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/50 bg-red-500/5 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-600">Erro ao salvar</div>
                <div className="text-xs text-muted-foreground mt-0.5 break-all">{submitError}</div>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setSubmitError(null)}>
                    Tentar de novo
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={forceFinish}>
                    Pular e ir ao dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Qual seu lado dominante?</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['destro', 'canhoto'] as const).map((lado) => (
                      <label
                        key={lado}
                        className={`border rounded-md p-4 text-center cursor-pointer transition-colors ${
                          watched.ladoDominante === lado
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={lado}
                          {...register('ladoDominante')}
                          className="sr-only"
                        />
                        <div className="text-3xl mb-1">{lado === 'destro' ? '🤚' : '✋'}</div>
                        <div className="text-sm font-medium capitalize">{lado}</div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="parceiroDuplas">Parceiro(a) de duplas (opcional)</Label>
                  <Input id="parceiroDuplas" placeholder="Nome do parceiro" {...register('parceiroDuplas')} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" placeholder="São Paulo" {...register('cidade')} />
                  </div>
                  <div>
                    <Label htmlFor="estado">UF</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      maxLength={2}
                      {...register('estado', {
                        setValueAs: (v) => (typeof v === 'string' ? v.toUpperCase() : v),
                      })}
                    />
                  </div>
                </div>

                <Button type="button" onClick={() => setStep(2)} className="w-full">
                  Próximo →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pesoAtual">Peso atual (kg)</Label>
                  <Input
                    id="pesoAtual"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    {...register('pesoAtual', { valueAsNumber: true })}
                  />
                  {errors.pesoAtual && (
                    <p className="text-xs text-red-500 mt-1">{errors.pesoAtual.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input
                    id="altura"
                    type="number"
                    inputMode="numeric"
                    {...register('altura', { valueAsNumber: true })}
                  />
                  {errors.altura && (
                    <p className="text-xs text-red-500 mt-1">{errors.altura.message}</p>
                  )}
                </div>
                {imcCalculado && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    IMC: <strong>{imcCalculado.toFixed(1)}</strong>
                  </div>
                )}
                <div>
                  <Label htmlFor="pesoMeta">Meta de peso (kg) — ex: 80</Label>
                  <Input
                    id="pesoMeta"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    {...register('pesoMeta', { valueAsNumber: true })}
                  />
                  {errors.pesoMeta && (
                    <p className="text-xs text-red-500 mt-1">{errors.pesoMeta.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tempoDeJogoMeses">Há quanto tempo joga pickleball (meses)?</Label>
                  <Input
                    id="tempoDeJogoMeses"
                    type="number"
                    inputMode="numeric"
                    {...register('tempoDeJogoMeses', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    ← Voltar
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1">
                    Próximo →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-md text-sm">
                  <p className="font-medium">🎯 Sua meta</p>
                  <p>Ser o melhor jogador <strong>50+ do Brasil até 2032</strong>.</p>
                  <p>Você tem 6 anos de preparação, começando agora.</p>
                </div>

                <div>
                  <Label htmlFor="outrosEsportes">Outros esportes que pratica (separar por vírgula)</Label>
                  <Input
                    id="outrosEsportes"
                    placeholder="Tênis, Corrida, Natação"
                    {...register('outrosEsportes')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    ← Voltar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Salvando...' : 'Começar a jornada 🚀'}
                  </Button>
                </div>
                {submitError && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={forceFinish}
                    className="w-full text-xs text-muted-foreground"
                  >
                    Pular e ir ao dashboard →
                  </Button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
