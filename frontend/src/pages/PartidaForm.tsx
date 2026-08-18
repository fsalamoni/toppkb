import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toaster';

export function PartidaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      data: new Date().toISOString().slice(0, 16),
      local: '',
      tipo: 'duplas',
      contexto: 'amistosa',
      adversario: '',
      placar: '',
      resultado: 'vitoria',
      oQueFuncionou: '',
      oQueMelhorar: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, '/app/partidas'), {
        data: new Date(data.data).toISOString(),
        local: data.local,
        tipo: data.tipo,
        contexto: data.contexto,
        adversarios: { jogador1: data.adversario, nivelEstimado: 'intermediario' },
        placar: { sets: [], placarFinal: data.placar },
        resultado: data.resultado,
        oQueFuncionou: data.oQueFuncionou,
        oQueMelhorar: data.oQueMelhorar,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Partida registrada! 🎾', variant: 'success' });
      navigate('/app/partidas');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nova Partida 🎾</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data e hora</Label>
                <Input type="datetime-local" {...register('data', { required: true })} />
              </div>
              <div>
                <Label>Local</Label>
                <Input placeholder="Clube A" {...register('local', { required: true })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <select {...register('tipo')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="simples">Simples</option>
                  <option value="duplas">Duplas</option>
                </select>
              </div>
              <div>
                <Label>Contexto</Label>
                <select {...register('contexto')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="amistosa">Amistosa</option>
                  <option value="treino">Treino</option>
                  <option value="torneio-oficial">Torneio</option>
                  <option value="ranking">Ranking</option>
                </select>
              </div>
              <div>
                <Label>Resultado</Label>
                <select {...register('resultado')} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="vitoria">Vitória</option>
                  <option value="derrota">Derrota</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Adversário(s)</Label>
              <Input placeholder="Nome do adversário ou dupla" {...register('adversario', { required: true })} />
            </div>

            <div>
              <Label>Placar final</Label>
              <Input placeholder="11-8, 11-9" {...register('placar')} />
            </div>

            <div>
              <Label>O que funcionou?</Label>
              <Textarea {...register('oQueFuncionou')} />
            </div>

            <div>
              <Label>O que melhorar?</Label>
              <Textarea {...register('oQueMelhorar')} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/app/partidas')}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Salvando...' : 'Salvar partida'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
