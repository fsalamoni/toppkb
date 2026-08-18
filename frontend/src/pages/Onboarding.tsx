import { useState } from 'react';
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

const schema = z.object({
  ladoDominante: z.enum(['destro', 'canhoto']),
  cidade: z.string().min(2).optional(),
  estado: z.string().length(2).optional(),
  parceiroDuplas: z.string().optional(),
  tempoDeJogoMeses: z.number().min(0).max(600).optional(),
  outrosEsportes: z.string().optional(),
  pesoAtual: z.coerce.number().min(40).max(250),
  altura: z.coerce.number().min(120).max(230),
  pesoMeta: z.coerce.number().min(40).max(150),
});

type FormData = z.infer<typeof schema>;

export function Onboarding() {
  const { user, userDoc, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
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
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: userDoc?.displayName || user.email?.split('@')[0] || 'Atleta',
          onboardingComplete: true,
          ladoDominante: data.ladoDominante,
          cidade: data.cidade || null,
          estado: data.estado?.toUpperCase() || null,
          parceiroDuplas: data.parceiroDuplas || null,
          tempoDeJogoMeses: data.tempoDeJogoMeses || null,
          outrosEsportes: data.outrosEsportes ? data.outrosEsportes.split(',').map(s => s.trim()) : [],
          pesoInicial: data.pesoAtual,
          altura: data.altura,
          imcInicial: imcCalculado,
          nivelInicial: 'iniciante-bom',
          objetivoFinal: 'Top 1 do Brasil 50+ em 2032',
          prazoMeses: 72,
          pesoMeta: data.pesoMeta,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({ title: 'Perfil completo!', description: 'Bem-vindo à jornada 🎯', variant: 'success' });
      navigate('/app/dashboard');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configurando seu perfil ({step}/3)</CardTitle>
          <CardDescription>Vamos começar pelo essencial</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input id="estado" placeholder="SP" maxLength={2} {...register('estado')} />
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
                  <Input id="pesoAtual" type="number" step="0.1" {...register('pesoAtual')} />
                </div>
                <div>
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input id="altura" type="number" {...register('altura')} />
                </div>
                {imcCalculado && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    IMC: <strong>{imcCalculado.toFixed(1)}</strong>
                  </div>
                )}
                <div>
                  <Label htmlFor="pesoMeta">Meta de peso (kg) — ex: 80</Label>
                  <Input id="pesoMeta" type="number" step="0.1" {...register('pesoMeta')} />
                </div>

                <div>
                  <Label htmlFor="tempoDeJogoMeses">Há quanto tempo joga pickleball (meses)?</Label>
                  <Input id="tempoDeJogoMeses" type="number" {...register('tempoDeJogoMeses')} />
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
                  <Input id="outrosEsportes" placeholder="Tênis, Corrida, Natação" {...register('outrosEsportes')} />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    ← Voltar
                  </Button>
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Salvando...' : 'Começar a jornada 🚀'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
