import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';

const DRILLS = ['dink', 'third-shot-drop', 'volley', 'saque', 'devolução', 'drive', 'lob', 'overhead', 'rally', 'posicionamento'];

export function TreinoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      duracaoMin: 60,
      tipo: 'tecnico',
      categoria: 'pickleball',
      local: '',
      comQuem: '',
      intensidade: 7,
      drillsRealizados: [] as string[],
      pontuacaoPercebida: 7,
      rpe: 7,
      oQueFuncionou: '',
      oQueMelhorar: '',
      proximoFoco: '',
    },
  });

  const drills = watch('drillsRealizados') || [];

  const toggleDrill = (d: string) => {
    setValue(
      'drillsRealizados',
      drills.includes(d) ? drills.filter((x) => x !== d) : [...drills, d],
    );
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      const payload = {
        ...data,
        data: new Date(data.data).toISOString(),
        duracaoMin: Number(data.duracaoMin),
        intensidade: Number(data.intensidade),
        pontuacaoPercebida: Number(data.pontuacaoPercebida),
        rpe: Number(data.rpe),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'users', user.uid, '/app/treinos'), payload);
      toast({ title: 'Treino registrado! 💪', variant: 'success' });
      navigate('/app/treinos');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Novo Treino 🏓</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data e hora</Label>
                <Input type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" {...register('duracaoMin', { required: true, min: 1 })} />
              </div>
            </div>

            <div>
              <Label>Tipo</Label>
              <select {...register('tipo')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="tecnico">Técnico</option>
                <option value="tatico">Tático</option>
                <option value="drills">Drills</option>
                <option value="partida-amistosa">Partida amistosa</option>
                <option value="duplas">Duplas</option>
                <option value="mental">Mental</option>
                <option value="fisico">Físico</option>
                <option value="recuperacao">Recuperação</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Local</Label>
                <Input placeholder="Clube A" {...register('local', { required: true })} />
              </div>
              <div>
                <Label>Com quem</Label>
                <Input placeholder="Amigos / Coach X" {...register('comQuem')} />
              </div>
            </div>

            <div>
              <Label>Intensidade ({watch('intensidade')}/10)</Label>
              <input type="range" min="1" max="10" {...register('intensidade')} className="w-full" />
            </div>

            <div>
              <Label>Drills realizados</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DRILLS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDrill(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      drills.includes(d)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>RPE ({watch('rpe')}/10)</Label>
              <input type="range" min="1" max="10" {...register('rpe')} className="w-full" />
            </div>

            <div>
              <Label>O que funcionou?</Label>
              <Textarea placeholder="Dink consistente, voleio firme..." {...register('oQueFuncionou')} />
            </div>

            <div>
              <Label>O que melhorar?</Label>
              <Textarea placeholder="Mais volume no 3rd shot drop..." {...register('oQueMelhorar')} />
            </div>

            <div>
              <Label>Próximo foco</Label>
              <Input placeholder="Cross-court dink" {...register('proximoFoco')} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/app/treinos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Salvando...' : 'Salvar treino'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
