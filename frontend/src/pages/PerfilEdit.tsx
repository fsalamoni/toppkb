import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toaster';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function PerfilEdit() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: userDoc?.displayName || '',
    cidade: userDoc?.cidade || '',
    estado: userDoc?.estado || '',
    parceiroDuplas: userDoc?.parceiroDuplas || '',
    pesoMeta: userDoc?.pesoMeta || 80,
    objetivoFinal: userDoc?.objetivoFinal || 'Top 1 do Brasil 50+ em 2032',
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true },
      );
      toast({ title: 'Perfil atualizado!', variant: 'success' });
      navigate('/app/configuracoes');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>UF</Label>
              <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} maxLength={2} />
            </div>
          </div>
          <div>
            <Label>Parceiro(a) de duplas</Label>
            <Input value={form.parceiroDuplas} onChange={(e) => setForm({ ...form, parceiroDuplas: e.target.value })} />
          </div>
          <div>
            <Label>Peso meta (kg)</Label>
            <Input type="number" value={form.pesoMeta} onChange={(e) => setForm({ ...form, pesoMeta: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Objetivo final</Label>
            <Textarea value={form.objetivoFinal} onChange={(e) => setForm({ ...form, objetivoFinal: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate('/app/configuracoes')}>Cancelar</Button>
            <Button onClick={onSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
