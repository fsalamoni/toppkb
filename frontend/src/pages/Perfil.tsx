import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMe, updateMe } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';

export function Perfil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    getMe().then((p) => {
      setProfile(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!profile) return <div>Faça login.</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({
        displayName: profile.displayName,
        ladoDominante: profile.ladoDominante,
        pesoMeta: profile.pesoMeta,
      });
      addToast({ type: 'success', message: 'Perfil atualizado' });
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro: ' + e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={profile.displayName || ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email || user?.email || ''} disabled />
          </div>
          <div>
            <Label>Lado dominante</Label>
            <select
              value={profile.ladoDominante || ''}
              onChange={(e) => setProfile({ ...profile, ladoDominante: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">Selecione</option>
              <option value="direito">Direito</option>
              <option value="esquerdo">Esquerdo</option>
              <option value="ambidestro">Ambidestro</option>
            </select>
          </div>
          <div>
            <Label>Peso meta (kg)</Label>
            <Input
              type="number"
              value={profile.pesoMeta || ''}
              onChange={(e) => setProfile({ ...profile, pesoMeta: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
