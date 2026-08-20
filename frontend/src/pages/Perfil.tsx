import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/lib/firebase';
import { calcularIMC } from '@/lib/utils';

type Profile = Record<string, any>;

export function Perfil() {
  const { user, userDoc } = useAuth();
  const addToast = useUIStore((s) => s.addToast);

  // Começa com o userDoc já carregado pelo AuthProvider — assim a página
  // NUNCA mostra "faça login" para quem está autenticado.
  const [profile, setProfile] = useState<Profile>(() => ({ ...(userDoc || {}) }));
  const [saving, setSaving] = useState(false);

  // Quando o userDoc chega/atualiza, preenche o form — mas mantém o que o
  // usuário já editou (prev vence sobre o userDoc).
  useEffect(() => {
    if (userDoc) setProfile((prev) => ({ ...userDoc, ...prev }));
  }, [userDoc]);

  // Busca direta (best-effort) para garantir os dados mais recentes.
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'toppkb_users', user.uid, 'profile', 'main'));
        if (!cancel && snap.exists()) setProfile((prev) => ({ ...snap.data(), ...prev }));
      } catch {
        /* ignora — já temos o userDoc */
      }
    })();
    return () => { cancel = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Faça login para ver seu perfil.</p>
            <Button asChild size="sm" className="mt-3"><Link to="/login">Ir para o login</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const set = (patch: Profile) => setProfile((p) => ({ ...p, ...patch }));
  const num = (v: string) => (v === '' ? undefined : Number(v));

  const pesoAtual = profile.pesoInicial ?? profile.pesoAtual;
  const imc = pesoAtual && profile.altura ? calcularIMC(Number(pesoAtual), Number(profile.altura)) : null;

  const camposEssenciais = [profile.displayName, profile.ladoDominante, profile.altura, pesoAtual, profile.pesoMeta];
  const incompleto = camposEssenciais.some((v) => v === undefined || v === null || v === '');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const outros = Array.isArray(profile.outrosEsportes)
        ? profile.outrosEsportes
        : typeof profile.outrosEsportes === 'string'
          ? profile.outrosEsportes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];

      const payload: Profile = {
        uid: user.uid,
        email: profile.email || user.email || null,
        displayName: profile.displayName || user.displayName || 'Atleta',
        photoURL: profile.photoURL || user.photoURL || null,
        ladoDominante: profile.ladoDominante || null,
        cidade: profile.cidade || null,
        estado: profile.estado ? String(profile.estado).toUpperCase().slice(0, 2) : null,
        parceiroDuplas: profile.parceiroDuplas || null,
        altura: profile.altura != null && profile.altura !== '' ? Number(profile.altura) : null,
        pesoInicial: pesoAtual != null && pesoAtual !== '' ? Number(pesoAtual) : null,
        pesoMeta: profile.pesoMeta != null && profile.pesoMeta !== '' ? Number(profile.pesoMeta) : null,
        imcInicial: imc,
        tempoDeJogoMeses:
          profile.tempoDeJogoMeses != null && profile.tempoDeJogoMeses !== ''
            ? Number(profile.tempoDeJogoMeses)
            : null,
        outrosEsportes: outros,
        objetivoFinal: profile.objetivoFinal || 'Top 1 do Brasil 50+ em 2032',
        // Se preencheu o essencial, marca cadastro como completo.
        onboardingComplete: profile.onboardingComplete === true || !incompleto,
        updatedAt: serverTimestamp(),
        updatedAtIso: new Date().toISOString(),
      };

      await setDoc(doc(db, 'toppkb_users', user.uid, 'profile', 'main'), payload, { merge: true });
      addToast({ type: 'success', message: 'Perfil salvo com sucesso!' });
    } catch (e: any) {
      addToast({ type: 'error', message: 'Erro ao salvar: ' + (e?.message || 'desconhecido') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-muted-foreground">Complete seu cadastro para o app funcionar melhor.</p>
      </div>

      {incompleto ? (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Cadastro incompleto</div>
              <p className="text-xs text-muted-foreground">
                Preencha nome, lado dominante, altura, peso atual e meta de peso, e toque em <strong>Salvar</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="text-sm font-medium">Cadastro completo ✅</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Essas informações personalizam seus treinos e metas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={profile.displayName || ''} onChange={(e) => set({ displayName: e.target.value })} placeholder="Seu nome" />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={profile.email || user.email || ''} disabled />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input value={profile.cidade || ''} onChange={(e) => set({ cidade: e.target.value })} placeholder="São Paulo" />
            </div>
            <div>
              <Label>UF</Label>
              <Input
                value={profile.estado || ''}
                maxLength={2}
                onChange={(e) => set({ estado: e.target.value.toUpperCase() })}
                placeholder="SP"
              />
            </div>
          </div>

          <div>
            <Label>Lado dominante</Label>
            <select
              value={profile.ladoDominante || ''}
              onChange={(e) => set({ ladoDominante: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              <option value="">Selecione</option>
              <option value="destro">Destro</option>
              <option value="canhoto">Canhoto</option>
              <option value="ambidestro">Ambidestro</option>
            </select>
          </div>

          <div>
            <Label>Parceiro(a) de duplas (opcional)</Label>
            <Input value={profile.parceiroDuplas || ''} onChange={(e) => set({ parceiroDuplas: e.target.value })} placeholder="Nome do parceiro" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Altura (cm)</Label>
              <Input type="number" inputMode="numeric" value={profile.altura ?? ''} onChange={(e) => set({ altura: num(e.target.value) })} placeholder="179" />
            </div>
            <div>
              <Label>Peso atual (kg)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={pesoAtual ?? ''} onChange={(e) => set({ pesoInicial: num(e.target.value) })} placeholder="95" />
            </div>
          </div>

          {imc && (
            <div className="bg-muted p-3 rounded-md text-sm">
              IMC atual: <strong>{imc.toFixed(1)}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meta de peso (kg)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={profile.pesoMeta ?? ''} onChange={(e) => set({ pesoMeta: num(e.target.value) })} placeholder="80" />
            </div>
            <div>
              <Label>Tempo de jogo (meses)</Label>
              <Input type="number" inputMode="numeric" value={profile.tempoDeJogoMeses ?? ''} onChange={(e) => set({ tempoDeJogoMeses: num(e.target.value) })} placeholder="24" />
            </div>
          </div>

          <div>
            <Label>Outros esportes (separe por vírgula)</Label>
            <Input
              value={Array.isArray(profile.outrosEsportes) ? profile.outrosEsportes.join(', ') : profile.outrosEsportes || ''}
              onChange={(e) => set({ outrosEsportes: e.target.value })}
              placeholder="Tênis, Corrida, Natação"
            />
          </div>

          <div>
            <Label>Objetivo</Label>
            <Input value={profile.objetivoFinal || ''} onChange={(e) => set({ objetivoFinal: e.target.value })} placeholder="Top 1 do Brasil 50+ em 2032" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/dashboard">Voltar ao dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
