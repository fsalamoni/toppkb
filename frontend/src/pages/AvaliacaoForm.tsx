import { useState } from 'react';
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

export function AvaliacaoForm() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    mes: new Date().toISOString().slice(0, 7),
    peso: userDoc?.pesoInicial || 95,
    horasTreino: 12,
    jogosMes: 4,
    vitorias: 2,
    derrotas: 2,
    diasSemDor: 25,
    diasComDorLeve: 4,
    diasComDorForte: 1,
    noitesSono7h: 20,
    diasPlanoCumprido: 20,
    maiorConquista: '',
    maiorDificuldade: '',
    notaGeral: 7,
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const imc = userDoc?.altura ? form.peso / Math.pow(userDoc.altura / 100, 2) : null;
      await addDoc(collection(db, 'users', user.uid, 'avaliacoes'), {
        ...form,
        imc,
        winRate: form.jogosMes > 0 ? (form.vitorias / form.jogosMes) * 100 : 0,
        dataPreenchimento: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Avaliação salva!', variant: 'success' });
      navigate('/metricas');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Avaliação Mensal 📊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mês</Label>
              <Input type="month" value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })} />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Horas de treino no mês</Label>
            <Input type="number" value={form.horasTreino} onChange={(e) => setForm({ ...form, horasTreino: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Jogos</Label>
              <Input type="number" value={form.jogosMes} onChange={(e) => setForm({ ...form, jogosMes: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Vitórias</Label>
              <Input type="number" value={form.vitorias} onChange={(e) => setForm({ ...form, vitorias: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Derrotas</Label>
              <Input type="number" value={form.derrotas} onChange={(e) => setForm({ ...form, derrotas: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Dias sem dor</Label>
              <Input type="number" max="31" value={form.diasSemDor} onChange={(e) => setForm({ ...form, diasSemDor: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Dias dor leve</Label>
              <Input type="number" max="31" value={form.diasComDorLeve} onChange={(e) => setForm({ ...form, diasComDorLeve: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Dias dor forte</Label>
              <Input type="number" max="31" value={form.diasComDorForte} onChange={(e) => setForm({ ...form, diasComDorForte: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Noites com 7h+ sono</Label>
              <Input type="number" max="31" value={form.noitesSono7h} onChange={(e) => setForm({ ...form, noitesSono7h: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Dias plano cumprido</Label>
              <Input type="number" max="31" value={form.diasPlanoCumprido} onChange={(e) => setForm({ ...form, diasPlanoCumprido: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Maior conquista do mês</Label>
            <Textarea value={form.maiorConquista} onChange={(e) => setForm({ ...form, maiorConquista: e.target.value })} />
          </div>
          <div>
            <Label>Maior dificuldade</Label>
            <Textarea value={form.maiorDificuldade} onChange={(e) => setForm({ ...form, maiorDificuldade: e.target.value })} />
          </div>

          <div>
            <Label>Nota geral ({form.notaGeral}/10)</Label>
            <input type="range" min="1" max="10" value={form.notaGeral} onChange={(e) => setForm({ ...form, notaGeral: Number(e.target.value) })} className="w-full" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate('/metricas')}>Cancelar</Button>
            <Button onClick={onSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar avaliação'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
